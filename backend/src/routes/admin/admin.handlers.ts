import { eq, and, asc, desc, or, ilike, sql, count } from "drizzle-orm";
import { auth } from "@lib/auth";
import type { User } from "@lib/auth";
import { db } from "@lib/db";
import {
	organization,
	user as authSchemaUser,
	user,
} from "@lib/db/schema/auth-schema";
import { ApiError, ForbiddenError, UnexpectedError } from "@lib/errors";
import {
	Fullroles,
	FullRoleType,
	orgRoles,
	orgRoleType,
	Permissions,
	roleDescriptions,
} from "@lib/security/permissions";
import {
	AccountRow,
	createPasswordlessUser,
	issueSetPasswordLink,
	resolveAccountState,
} from "@lib/services/users.services";
import { WELCOME_REDIRECT } from "@routes/platformAdmin/orgRequest.handlers";
import { sendOrgMemberAdded, welcomeEmail } from "@lib/email";
import { assertOrgPermission } from "@lib/security/helpers";
import { APIError as betterAuthApiError } from "better-auth/api";
import { member } from "@lib/db/schema/auth-schema";
import { getPendingWork, PendingSource } from "@lib/pending";
import { logQuiet } from "@lib/audit";

// both are required up front
const ORG_MEMBER_PERMISSIONS: Permissions = {
	member: ["create"],
	invitation: ["create"],
};

async function getOrganizationName(organizationId: string) {
	const [org] = await db
		.select({ name: organization.name })
		.from(organization)
		.where(eq(organization.id, organizationId))
		.limit(1);
	if (!org) throw new ApiError(404, "Organization not found");
	return org.name;
}

function sendOrgMemberWelcome(
	target: AccountRow,
	organizationName: string,
	inviterName: string,
) {
	return issueSetPasswordLink(
		target,
		WELCOME_REDIRECT,
		async (url) =>
			(await welcomeEmail(target, url, {
				kind: "org-member",
				organizationName,
				inviterName,
			})) !== false,
	);
}

async function deleteUserQuietly(userId: string) {
	try {
		await db.delete(authSchemaUser).where(eq(authSchemaUser.id, userId));
	} catch (e) {
		console.error("failed to remove half-created user:", userId, e);
	}
}

export async function addOrgMemberHandler(
	actor: User,
	headers: Headers,
	organizationId: string,
	body: { email: string; name: string; role: orgRoleType; phone: string },
) {
	await assertOrgPermission(headers, organizationId, ORG_MEMBER_PERMISSIONS);

	const logAdded = (userId: string, userName: string) =>
		logQuiet(db, {
			module: "members",
			action: "member.added",
			description: `${actor.name} added ${userName} as ${body.role}`,
			organizationId,
			actorId: actor.id,
			metadata: {
				entityType: "user",
				ids: [userId],
				count: 1,
				role: body.role,
			},
		});

	const name = body.name.trim();
	if (!name) throw new ApiError(400, "Name is required");
	const phone = body.phone.trim();
	if (!phone) throw new ApiError(400, "Phone is required");
	const organizationName = await getOrganizationName(organizationId);

	let state = await resolveAccountState(body.email, organizationId);

	// 1. no account: create, add as a member, send the set-password link
	if (state.kind === "none") {
		const created = await createPasswordlessUser({
			email: body.email,
			name,
			phone: [phone],
		});
		if (created) {
			try {
				await auth.api.addMember({
					body: {
						userId: created.id,
						role: body.role,
						organizationId,
					},
				});
			} catch (e) {
				// the new account has no password or sessions, so removing it is safe
				await deleteUserQuietly(created.id);
				throw e;
			}
			// on failure the issuer rolls back its own state; a retry of this call
			// lands in branch 2 below and resends
			await logAdded(created.id, name);
			await sendOrgMemberWelcome(created, organizationName, actor.name);
			return { success: true };
		}
		// lost a race: this email was created a moment ago
		state = await resolveAccountState(body.email, organizationId);
		if (state.kind === "none") {
			throw new ApiError(500, "Could not add the member");
		}
	}

	// 2. already a member of this org: resend if unfinished, otherwise nothing to do
	if (state.isMember) {
		if (state.kind === "pending") {
			await sendOrgMemberWelcome(
				state.user,
				organizationName,
				actor.name,
			);
		}
		return { success: true };
	}

	// 3. account exists elsewhere: add them directly and tell them
	await auth.api.addMember({
		body: { userId: state.user.id, role: body.role, organizationId },
	});
	await logAdded(state.user.id, state.user.name);
	// the member is already added, so an email failure must not fail the request:
	// a retry would land in branch 2 and do nothing
	try {
		if (state.kind === "pending") {
			await sendOrgMemberWelcome(
				state.user,
				organizationName,
				actor.name,
			);
		} else {
			await sendOrgMemberAdded(
				state.user,
				organizationId,
				organizationName,
				actor.name,
			);
		}
	} catch (e) {
		console.error("Member added but notification email failed:", e);
	}
	return { success: true };
}

export async function resendOrgMemberWelcomeHandler(
	actor: User,
	headers: Headers,
	organizationId: string,
	body: { email: string },
) {
	await assertOrgPermission(headers, organizationId, ORG_MEMBER_PERMISSIONS);

	const organizationName = await getOrganizationName(organizationId);

	const state = await resolveAccountState(body.email, organizationId);

	// only members of THIS org are visible; everyone else looks nonexistent
	if (state.kind === "none" || !state.isMember) {
		throw new ApiError(404, "User not found");
	}

	// the issuer returns 400 for a finished account and 409 during the cooldown,
	// and rolls everything back if the email fails
	await sendOrgMemberWelcome(state.user, organizationName, actor.name);
	return { success: true };
}

// generic function for better auth errors
export function handleApiError(e: unknown): never {
	if (e instanceof betterAuthApiError) {
		throw new ApiError(e.statusCode, e.message);
	}
	throw new UnexpectedError();
}

// only org roles (orgRoleType); owner is never grantable from here
export async function setOrgMemberRoleHandler(
	actor: User,
	headers: Headers,
	organizationId: string,
	memberId: string,
	role: orgRoleType,
) {
	await assertOrgPermission(headers, organizationId, { member: ["update"] });

	// the member must belong to THIS org, or an id from another org could be passed
	const [target] = await db
		.select({
			id: member.id,
			role: member.role,
			userId: member.userId,
			userName: user.name,
		})
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(
			and(
				eq(member.id, memberId),
				eq(member.organizationId, organizationId),
			),
		)
		.limit(1);
	if (!target) {
		throw new ApiError(404, "Member not found");
	}

	// owners come only from approval, so their role isn't changed from here
	const isOwner = target.role
		.split(",")
		.map((r) => r.trim())
		.includes("owner");
	if (isOwner) {
		throw new ForbiddenError("An owner's role can't be changed here");
	}

	try {
		const updated = await auth.api.updateMemberRole({
			headers,
			body: { memberId, role, organizationId },
		});
		if (target.role !== role) {
			await logQuiet(db, {
				module: "members",
				action: "member.role_changed",
				description: `${actor.name} changed ${target.userName} from ${target.role} to ${role}`,
				organizationId,
				actorId: actor.id,
				metadata: {
					entityType: "user",
					ids: [target.userId],
					count: 1,
					memberId,
					from: target.role,
					to: role,
				},
			});
		}
		return { member: updated };
	} catch (e) {
		handleApiError(e);
	}
}

const SORT_COLUMNS = {
	createdAt: member.createdAt,
	name: user.name,
	email: user.email,
} as const;

// escape LIKE wildcards so a search for "100%" or "a_b" is literal
const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

export async function listOrgMembersHandler(
	headers: Headers,
	organizationId: string,
	query: {
		searchValue?: string;
		emailVerified?: boolean;
		role?: string;
		limit?: number;
		offset?: number;
		sortBy?: keyof typeof SORT_COLUMNS;
		sortDirection?: "asc" | "desc";
	},
) {
	await assertOrgPermission(headers, organizationId, { member: ["read"] });
	const limit = query.limit ?? 20;
	const offset = query.offset ?? 0;
	const sortColumn = SORT_COLUMNS[query.sortBy ?? "createdAt"];
	const direction = (query.sortDirection ?? "desc") === "asc" ? asc : desc;

	const search = query.searchValue?.trim();
	const pattern = search ? `%${escapeLike(search)}%` : undefined;

	const where = and(
		eq(member.organizationId, organizationId),
		pattern
			? or(
					ilike(user.name, pattern),
					ilike(user.email, pattern),
					// phone is text[]: match if any number contains the search term
					sql`EXISTS (SELECT 1 FROM unnest(${user.phone}) AS p WHERE p ILIKE ${pattern})`,
				)
			: undefined,
		query.emailVerified !== undefined
			? eq(user.emailVerified, query.emailVerified)
			: undefined,
		// role is a comma-separated text column ("admin,billing"), so match one element
		query.role
			? sql`${query.role} = ANY(regexp_split_to_array(${member.role}, '\\s*,\\s*'))`
			: undefined,
	);

	const [rows, countRows] = await Promise.all([
		db
			.select({
				id: member.id,
				name: user.name,
				email: user.email,
				phone: user.phone, // string[] | null
				emailVerified: user.emailVerified,
				role: member.role,
				createdAt: member.createdAt,
			})
			.from(member)
			.innerJoin(user, eq(user.id, member.userId))
			.where(where)
			.orderBy(direction(sortColumn), asc(member.id))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(member)
			.innerJoin(user, eq(user.id, member.userId))
			.where(where),
	]);

	return { members: rows, total: countRows[0]?.total ?? 0, limit, offset };
}

export async function getOrgMemberHandler(
	headers: Headers,
	organizationId: string,
	memberId: string,
) {
	await assertOrgPermission(headers, organizationId, { member: ["read"] });

	// scoped to THIS org, so a member id from another org returns 404
	const [row] = await db
		.select({
			id: member.id,
			userId: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			image: user.image,
			phone: user.phone,
			role: member.role,
			joinedAt: member.createdAt,
		})
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(
			and(
				eq(member.id, memberId),
				eq(member.organizationId, organizationId),
			),
		)
		.limit(1);

	if (!row) {
		throw new ApiError(404, "Member not found");
	}

	return { member: row };
}

export async function updateOrgMemberHandler(
	headers: Headers,
	organizationId: string,
	memberId: string,
	data: { name?: string; phone?: string[] },
) {
	await assertOrgPermission(headers, organizationId, { member: ["update"] });

	// the member must belong to THIS org
	const [target] = await db
		.select({ userId: member.userId, role: member.role })
		.from(member)
		.where(
			and(
				eq(member.id, memberId),
				eq(member.organizationId, organizationId),
			),
		)
		.limit(1);
	if (!target) {
		throw new ApiError(404, "Member not found");
	}

	const isOwner = target.role
		.split(",")
		.map((r) => r.trim())
		.includes("owner");
	if (isOwner) {
		throw new ForbiddenError("An owner's profile can't be changed here");
	}

	// undefined fields are skipped by Drizzle; updatedAt is handled by $onUpdate
	const [updated] = await db
		.update(user)
		.set({ name: data.name?.trim(), phone: data.phone })
		.where(eq(user.id, target.userId))
		.returning({
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			phone: user.phone,
		});

	if (!updated) {
		throw new ApiError(404, "Member not found");
	}

	return { member: { id: memberId, ...updated } };
}

export async function getOrgStatsHandler(
	headers: Headers,
	organizationId: string,
) {
	await assertOrgPermission(headers, organizationId, { member: ["read"] });

	const [row] = await db
		.select({
			totalUsers: count(),
			unverifiedUsers:
				sql<number>`count(*) filter (where ${user.emailVerified} = false)`.mapWith(
					Number,
				),
			// role is comma-separated text ("admin,billing"), so match one element
			adminUsers:
				sql<number>`count(*) filter (where 'admin' = any(regexp_split_to_array(${member.role}, '\\s*,\\s*')))`.mapWith(
					Number,
				),
		})
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(eq(member.organizationId, organizationId));

	return {
		totalUsers: row?.totalUsers ?? 0,
		unverifiedUsers: row?.unverifiedUsers ?? 0,
		adminUsers: row?.adminUsers ?? 0,
	};
}

export async function getOrgRolesHandler(
	headers: Headers,
	organizationId: string,
	assignable = false,
) {
	await assertOrgPermission(headers, organizationId, { roles: ["list"] });

	const source = assignable ? orgRoles : Fullroles;

	return (Object.keys(source) as FullRoleType[]).map((name) => ({
		name,
		description: roleDescriptions[name],
	}));
}

export async function removeOrgMemberHandler(
	actor: User,
	headers: Headers,
	organizationId: string,
	memberId: string,
) {
	await assertOrgPermission(headers, organizationId, { member: ["delete"] });

	// scoped to THIS org, so a member id from another org returns 404
	const [target] = await db
		.select({
			userId: member.userId,
			role: member.role,
			userName: user.name,
		})
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(
			and(
				eq(member.id, memberId),
				eq(member.organizationId, organizationId),
			),
		)
		.limit(1);
	if (!target) {
		throw new ApiError(404, "Member not found");
	}

	if (target.userId === actor.id) {
		throw new ApiError(400, "You can't remove yourself from here");
	}

	const isOwner = target.role
		.split(",")
		.map((r) => r.trim())
		.includes("owner");
	if (isOwner) {
		throw new ForbiddenError("An owner can't be removed here");
	}

	try {
		// removes only the member row: the user account, sessions and other orgs stay
		await auth.api.removeMember({
			headers,
			body: { memberIdOrEmail: memberId, organizationId },
		});
		await logQuiet(db, {
			module: "members",
			action: "member.removed",
			description: `${actor.name} removed ${target.userName} (${target.role})`,
			organizationId,
			actorId: actor.id,
			metadata: {
				entityType: "user",
				ids: [target.userId],
				count: 1,
				memberId,
				role: target.role,
			},
		});
	} catch (e) {
		handleApiError(e);
	}

	return { success: true };
}

export async function getOrgPendingWorkHandler(
	headers: Headers,
	organizationId: string,
) {
	await assertOrgPermission(headers, organizationId, { member: ["read"] });

	const usersPath = `/${encodeURIComponent(organizationId)}/admin/users`;

	const pendingSources: PendingSource[] = [
		{
			id: "unverified",
			count: async () => {
				// db.$count takes no joins, and emailVerified lives on user
				const [row] = await db
					.select({ total: count() })
					.from(member)
					.innerJoin(user, eq(user.id, member.userId))
					.where(
						and(
							eq(member.organizationId, organizationId),
							eq(user.emailVerified, false),
						),
					);
				return row?.total ?? 0;
			},
			label: (n) =>
				n === 1
					? "member hasn't verified their email"
					: "members haven't verified their email",
			href: `${usersPath}?emailVerified=false`,
			action: "Review",
		},
	];

	return getPendingWork(pendingSources);
}
