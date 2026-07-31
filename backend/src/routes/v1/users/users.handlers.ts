import { User } from "@lib/auth";
import { sql, eq } from "drizzle-orm";
import { db } from "@lib/db";
import {
	user as authSchemaUser,
	verification,
} from "@lib/db/schema/auth-schema";
import { nanoid } from "nanoid";
import { welcomeEmail } from "@lib/email";
import { env } from "@lib/env";
import { assertPermission, hasPermission } from "@lib/permissions/helpers";
import {
	roleDescriptions,
	fullRoles,
	tenantRoles,
	fullModules,
	tenantModules,
} from "@lib/permissions/roles";
import { ApiError, ForbiddenError } from "@lib/errors";

// if the user has list-full return all roles if just list return tenant scoped roles
export async function handleGetRoles(user: User) {
	const canListFull = await hasPermission(user.id, { roles: ["list-full"] });

	if (!canListFull) {
		await assertPermission(user.id, { roles: ["list"] });
	}

	const roleSet = canListFull ? fullRoles : tenantRoles;

	return Object.keys(roleSet).map((roleName) => ({
		name: roleName,
		description: roleDescriptions[roleName as keyof typeof fullRoles],
	}));
}

// same as above split based on full
export async function handleGetRolesFull(user: User) {
	const canListFull = await hasPermission(user.id, {
		roles: ["list-full"],
	});

	if (!canListFull) {
		await assertPermission(user.id, {
			roles: ["list"],
		});
	}

	const [moduleSet, roleSet] = canListFull
		? [fullModules, fullRoles]
		: [tenantModules, tenantRoles];

	return {
		modules: Object.entries(moduleSet).map(([moduleName, actions]) => ({
			module: moduleName,
			actions: [...actions],
		})),
		roles: Object.entries(roleSet).map(([roleName, role]) => ({
			role: roleName,
			permissions: role.statements as Record<string, string[]>,
		})),
	};
}

export async function getUserStats(user: User) {
	await assertPermission(user.id, { user: ["list"] });

	if (!user.tenantId) throw new ForbiddenError();

	const [stats] = await db
		.select({
			totalUsers: sql<number>`count(*)::int`,
			bannedUsers: sql<number>`count(*) filter (
				where ${authSchemaUser.banned} = true
				and (${authSchemaUser.banExpires} is null or ${authSchemaUser.banExpires} > now())
			)::int`,
			unverifiedUsers: sql<number>`count(*) filter (where ${authSchemaUser.emailVerified} = false)::int`,
			adminUsers: sql<number>`count(*) filter (where ${authSchemaUser.role} = 'admin')::int`,
		})
		.from(authSchemaUser)
		// tenant id check
		.where(eq(authSchemaUser.tenantId, user.tenantId));

	return (
		stats ?? {
			totalUsers: 0,
			bannedUsers: 0,
			unverifiedUsers: 0,
			adminUsers: 0,
		}
	);
}

export async function handleSendWelcomeEmail(
	actingUser: User,
	email: string,
	redirectTo: string,
) {
	const ALLOWED_ORIGINS = [env.BETTER_AUTH_URL];
	const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
	const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // preventing spamming for 5min

	await assertPermission(actingUser.id, { user: ["create"] });

	let redirectOrigin: string;
	try {
		redirectOrigin = new URL(redirectTo).origin;
	} catch {
		throw new ApiError(400, "Invalid redirectTo");
	}
	// TODO allow passing relative links eg /welcome
	if (!ALLOWED_ORIGINS.includes(redirectOrigin)) {
		throw new ApiError(400, "redirectTo origin not allowed");
	}

	const [invitee] = await db
		.select()
		.from(authSchemaUser)
		.where(eq(authSchemaUser.email, email))
		.limit(1);

	if (!invitee) throw new ApiError(404, "User not found");
	if (invitee.emailVerified) {
		throw new ApiError(400, "User has already completed setup");
	}

	if (
		invitee.welcomeEmailSentAt &&
		Date.now() - invitee.welcomeEmailSentAt.getTime() < RESEND_COOLDOWN_MS
	) {
		throw new ApiError(409, "Invite recently sent, try again shortly");
	}

	// ensure tenancy integrity
	if (invitee.tenantId) {
		if (actingUser.tenantId !== invitee.tenantId) {
			throw new ApiError(404, "User not found");
		}
	} else {
		// ensure that if the user has no tenant id its a platform admin inviting another platform admin
		await assertPermission(actingUser.id, {
			tenants: ["create"],
		});
	}

	const token = nanoid(32);
	await db.insert(verification).values({
		id: nanoid(),
		identifier: `reset-password:${token}`,
		value: invitee.id,
		expiresAt: new Date(Date.now() + INVITE_TTL_MS),
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const url = `${env.BETTER_AUTH_URL}/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent(redirectTo)}`;
	welcomeEmail(invitee, url);

	await db
		.update(authSchemaUser)
		.set({ welcomeEmailSentAt: new Date() })
		.where(eq(authSchemaUser.id, invitee.id));

	return {
		success: "true",
	};
}
