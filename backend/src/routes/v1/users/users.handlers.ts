import { status } from "elysia";
import {
	assertPermission,
	roles,
	roleDescriptions,
	modules,
} from "@lib/permissions";
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

export async function handleGetRoles(user: User) {
	const err = await assertPermission(user.id, { roles: ["list"] });
	if (err) return status(403, { error: err.message });

	return Object.keys(roles).map((roleName) => ({
		name: roleName,
		description: roleDescriptions[roleName as keyof typeof roles],
	}));
}

export async function handleGetRolesFull(user: User) {
	const err = await assertPermission(user.id, { roles: ["list"] });
	if (err) return status(403, { error: err.message });

	return {
		modules: Object.entries(modules).map(([moduleName, actions]) => ({
			module: moduleName,
			actions: [...actions],
		})),
		roles: Object.entries(roles).map(([roleName, role]) => ({
			role: roleName,
			permissions: role.statements as Record<string, string[]>,
		})),
	};
}

export async function getUserStats(user: User) {
	const err = await assertPermission(user.id, { user: ["list"] });
	if (err) return status(403, { error: err.message });

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
		.from(authSchemaUser);

	if (stats) {
		return stats;
	}

	return status(404, { error: "Not found" });
}

export class WelcomeEmailError extends Error {
	constructor(
		message: string,
		public code:
			| "FORBIDDEN"
			| "INVALID_REDIRECT"
			| "USER_NOT_FOUND"
			| "ALREADY_VERIFIED"
			| "RATE_LIMITED",
	) {
		super(message);
		this.name = "WelcomeEmailError";
	}
}

const ERROR_STATUS: Record<WelcomeEmailError["code"], number> = {
	FORBIDDEN: 403,
	INVALID_REDIRECT: 400,
	USER_NOT_FOUND: 404,
	ALREADY_VERIFIED: 400,
	RATE_LIMITED: 429,
};

export async function sendWelcomeEmail(
	actingUserId: string,
	email: string,
	redirectTo: string,
) {
	const ALLOWED_ORIGINS = [env.BETTER_AUTH_URL];
	const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
	const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // preventing spamming for 5min

	const err = await assertPermission(actingUserId, { user: ["create"] });
	if (err) throw new WelcomeEmailError(err.message, "FORBIDDEN");

	let redirectOrigin: string;
	try {
		redirectOrigin = new URL(redirectTo).origin;
	} catch {
		throw new WelcomeEmailError("Invalid redirectTo", "INVALID_REDIRECT");
	}
	if (!ALLOWED_ORIGINS.includes(redirectOrigin)) {
		throw new WelcomeEmailError(
			"redirectTo origin not allowed",
			"INVALID_REDIRECT",
		);
	}

	const [invitee] = await db
		.select()
		.from(authSchemaUser)
		.where(eq(authSchemaUser.email, email))
		.limit(1);

	if (!invitee)
		throw new WelcomeEmailError("User not found", "USER_NOT_FOUND");
	if (invitee.emailVerified) {
		throw new WelcomeEmailError(
			"User has already completed setup",
			"ALREADY_VERIFIED",
		);
	}

	if (
		invitee.welcomeEmailSentAt &&
		Date.now() - invitee.welcomeEmailSentAt.getTime() < RESEND_COOLDOWN_MS
	) {
		throw new WelcomeEmailError(
			"Invite recently sent, try again shortly",
			"RATE_LIMITED",
		);
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
}

// Route handler — the only place that knows about HTTP status codes
export async function handleSendWelcomeEmail(
	user: User,
	email: string,
	redirectTo: string,
) {
	try {
		await sendWelcomeEmail(user.id, email, redirectTo);
		return status(202, { success: true });
	} catch (e) {
		if (e instanceof WelcomeEmailError) {
			return status(ERROR_STATUS[e.code], { error: e.message });
		}
		throw e; // unexpected error
	}
}
