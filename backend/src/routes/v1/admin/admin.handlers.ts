// all functions in this file are a wrapper over betterauth admin plugin
// essentially a tenancy check ensuring admins can only affect their own organization
// this is through the 	assertPermissionAndTenant, assertCanActOnUser, functions
// so all of them follow the same format
// can this admin access that orgs data if yes continue if no or does not exist a 403 is returned

import { auth, User } from "@lib/auth";
import { db } from "@lib/db";
import {
	and,
	asc,
	desc,
	count,
	eq,
	ilike,
	type SQL,
	getTableColumns,
	or,
} from "drizzle-orm";
import { session, user as authSchemaUser } from "@lib/db/schema/auth-schema";

import { APIError as betterAuthApiError } from "better-auth";
import {
	assertPermissionAndTenant,
	assertPermission,
	assertCanActOnUser,
} from "@lib/permissions/helpers";
import { TenantRole } from "@lib/permissions/roles";
import { ApiError, ForbiddenError, UnexpectedError } from "@lib/errors";

// these fields cannot be set by an admin through create or update user
// they have their own way to be set
const DISALLOWED_DATA_FIELDS = new Set([
	"tenantId",
	"emailVerified",
	"banned",
	"banReason",
	"banExpires",
]);

// basically get an inverse from above disallowed
const ALLOWED_DATA_FIELDS = new Set(
	Object.keys(getTableColumns(authSchemaUser)).filter(
		(k) => !DISALLOWED_DATA_FIELDS.has(k),
	),
);

// in list users the columns that one can sort are the ones defined in the db
// limit to a max of 200 users at once and default to 100
const SORTABLE_COLUMNS = getTableColumns(authSchemaUser);
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

// generic function for better auth errors
export function handleApiError(e: unknown): never {
	if (e instanceof betterAuthApiError) {
		throw new ApiError(e.statusCode, e.message);
	}

	throw new UnexpectedError();
}

// only tenant roles
export async function handleSetRole(
	actor: User,
	requestHeaders: Headers,
	userId: string,
	role: TenantRole,
) {
	await assertPermissionAndTenant(actor.id, actor.tenantId, userId, {
		user: ["set-role"],
	});

	try {
		const { user: updatedUser } = await auth.api.setRole({
			body: { userId, role },
			headers: requestHeaders,
		});

		return { user: updatedUser };
	} catch (e) {
		handleApiError(e);
	}
}

export async function handleGetUser(
	actor: User,
	userId: string,
	requestHeaders: Headers,
) {
	await assertPermissionAndTenant(actor.id, actor.tenantId, userId, {
		user: ["get"],
	});
	try {
		const data = await auth.api.getUser({
			query: { id: userId },
			headers: requestHeaders,
		});
		return data;
	} catch (e) {
		return handleApiError(e);
	}
}

export async function handleUnbanUser(
	actor: User,
	userId: string,
	requestHeaders: Headers,
) {
	await assertPermissionAndTenant(actor.id, actor.tenantId, userId, {
		user: ["ban"],
	});
	try {
		const data = await auth.api.unbanUser({
			body: { userId },
			headers: requestHeaders,
		});
		return data;
	} catch (e) {
		return handleApiError(e);
	}
}

export async function handleBanUser(
	actor: User,
	userId: string,
	requestHeaders: Headers,
	banReason?: string,
	banExpiresIn?: number,
) {
	await assertPermissionAndTenant(actor.id, actor.tenantId, userId, {
		user: ["ban"],
	});
	try {
		const data = await auth.api.banUser({
			body: { userId, banReason, banExpiresIn },
			headers: requestHeaders,
		});
		return data;
	} catch (e) {
		return handleApiError(e);
	}
}

export async function handleRevokeUserSession(
	actor: User,
	sessionToken: string,
	requestHeaders: Headers,
) {
	await assertPermission(actor.id, {
		session: ["revoke"],
	});

	const [target] = await db
		.select({ userId: session.userId })
		.from(session)
		.where(eq(session.token, sessionToken))
		.limit(1);

	// same response as tenancy check
	if (!target) throw new ForbiddenError();

	await assertCanActOnUser(actor.tenantId, target.userId);

	try {
		const data = await auth.api.revokeUserSession({
			body: { sessionToken },
			headers: requestHeaders,
		});
		return { success: data.success };
	} catch (e) {
		return handleApiError(e);
	}
}

export async function handleRevokeUserSessions(
	actor: User,
	userId: string,
	requestHeaders: Headers,
) {
	await assertPermissionAndTenant(actor.id, actor.tenantId, userId, {
		session: ["delete"],
	});

	try {
		const data = await auth.api.revokeUserSessions({
			body: { userId },
			headers: requestHeaders,
		});
		return { success: data.success };
	} catch (e) {
		return handleApiError(e);
	}
}

export async function handleListUserSessions(
	actor: User,
	userId: string,
	requestHeaders: Headers,
) {
	await assertPermissionAndTenant(actor.id, actor.tenantId, userId, {
		session: ["list"],
	});
	try {
		const data = await auth.api.listUserSessions({
			body: { userId },
			headers: requestHeaders,
		});
		return data;
	} catch (e) {
		return handleApiError(e);
	}
}

export async function handleListUsers(
	actor: User,
	params: {
		searchValue?: string;
		limit?: number;
		offset?: number;
		sortBy?: string;
		sortDirection?: "asc" | "desc";
	},
) {
	await assertPermission(actor.id, { user: ["list"] });

	if (!actor.tenantId) {
		throw new ForbiddenError();
	}

	// first scope to the admins tenant
	const conditions: SQL[] = [eq(authSchemaUser.tenantId, actor.tenantId)];

	if (params.searchValue) {
		const pattern = `%${params.searchValue}%`;
		conditions.push(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			or(
				ilike(authSchemaUser.name, pattern),
				ilike(authSchemaUser.email, pattern),
			)!,
		);
	}
	// search for name in the map of all table fields if not there default to createdat
	const sortColumn =
		params.sortBy && params.sortBy in SORTABLE_COLUMNS
			? SORTABLE_COLUMNS[params.sortBy as keyof typeof SORTABLE_COLUMNS]
			: SORTABLE_COLUMNS.createdAt;
	const orderBy =
		params.sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

	const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
	const offset = Math.max(params.offset ?? 0, 0);

	const whereClause = and(...conditions);

	const [users, totalResult] = await Promise.all([
		db
			.select()
			.from(authSchemaUser)
			.where(whereClause)
			.orderBy(orderBy)
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(authSchemaUser).where(whereClause),
	]);

	const total = totalResult[0]?.total ?? 0;
	return { users, total, limit, offset };
}

export async function handleCreateUser(
	actor: User,
	requestHeaders: Headers,
	email: string,
	name: string,
	role: TenantRole,
	data: Record<string, unknown> = {},
) {
	await assertPermission(actor.id, { user: ["create"] });

	if (!actor.tenantId) throw new ForbiddenError();

	for (const key of Object.keys(data)) {
		if (!ALLOWED_DATA_FIELDS.has(key)) {
			throw new ApiError(400, `Field '${key}' cannot be set via data`);
		}
	}

	try {
		const { user: newUser } = await auth.api.createUser({
			body: {
				email,
				name,
				role,
				data: {
					...data,
					tenantId: actor.tenantId, // always last server side
				},
			},
			headers: requestHeaders,
		});

		return { user: newUser };
	} catch (e) {
		return handleApiError(e);
	}
}

export async function handleUpdateUser(
	actor: User,
	userId: string,
	data: Record<string, unknown>,
	requestHeaders: Headers,
) {
	await assertPermissionAndTenant(actor.id, actor.tenantId, userId, {
		user: ["update"],
	});

	for (const key of Object.keys(data)) {
		if (!ALLOWED_DATA_FIELDS.has(key)) {
			throw new ApiError(400, `Field '${key}' cannot be set via data`);
		}
	}

	try {
		const updatedUser = await auth.api.adminUpdateUser({
			body: {
				userId,
				data: {
					...data,
					tenantId: actor.tenantId, // never movable between tenants via this endpoint
				},
			},
			headers: requestHeaders,
		});
		return { user: updatedUser };
	} catch (e) {
		return handleApiError(e);
	}
}
