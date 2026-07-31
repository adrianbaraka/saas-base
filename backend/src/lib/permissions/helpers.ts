import { Elysia } from "elysia";

import { eq } from "drizzle-orm";
import { user as authSchemaUser } from "@lib/db/schema/auth-schema";
import { auth } from "@lib/auth";
import { statement } from "./roles";
import { db } from "@lib/db";
import { ForbiddenError, UnauthorizedError } from "@lib/errors";

// checks that user is authenticated
export const authMacro = new Elysia({ name: "auth-macro" }).macro({
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	isAuthenticated: (_enabled: boolean) => ({
		async resolve({ request: { headers } }) {
			const session = await auth.api.getSession({ headers });
			if (!session) throw new UnauthorizedError();
			return {
				user: session.user,
				session: session.session,
			};
		},
	}),
});

/////////////////////////////////////////////////////////
// helper functions

type Statement = typeof statement;
type Permissions = {
	[K in keyof Statement]?: Statement[K][number][];
};

/**
 * Asserts that a user has the required permissions.
 *
 * Returns normally when the permission check succeeds.
 * Throws a {@link ForbiddenError} when the user lacks the required permissions.
 *
 * @throws {ForbiddenError}
 *
 * @example
 * await assertPermission(user.id, {
 *   tenants: ["delete"],
 * });
 */
export async function assertPermission(
	userId: string,
	permissions: Permissions,
	message = "Forbidden",
): Promise<void> {
	const data = await auth.api.userHasPermission({
		body: {
			userId,
			permissions,
		},
	});

	if (!data.success) {
		throw new ForbiddenError(message);
	}
}

/**
 * Asserts that the target user exists and belongs to the same tenant as the actor.
 *
 * Returns normally when the assertion succeeds.
 * Throws a {@link ForbiddenError} if:
 * - the actor does not belong to a tenant,
 * - the target user does not exist,
 * - the target user does not belong to a tenant, or
 * - the target user belongs to a different tenant.
 *
 * @throws {ForbiddenError}
 *
 * @example
 * await assertCanActOnUser(actor.tenantId, targetUserId);
 */
export async function assertCanActOnUser(
	actorTenantId: string | null | undefined,
	targetUserId: string,
	message = "Forbidden",
): Promise<void> {
	// An actor without a tenant can never act on another user.
	if (!actorTenantId) {
		throw new ForbiddenError(message);
	}

	const [target] = await db
		.select({
			tenantId: authSchemaUser.tenantId,
		})
		.from(authSchemaUser)
		.where(eq(authSchemaUser.id, targetUserId))
		.limit(1);

	// Intentionally return the same error for all failure cases to avoid
	// revealing whether the target user exists or belongs to another tenant.
	if (!target || !target.tenantId || target.tenantId !== actorTenantId) {
		throw new ForbiddenError(message);
	}
}

/**
 * Asserts that the actor has the required permissions and is allowed to act
 * on the target user.
 *
 * Returns normally when both assertions succeed.
 * Throws a {@link ForbiddenError} if either check fails.
 *
 * @throws {ForbiddenError}
 *
 * @example
 * await assertPermissionAndTenant(
 *   actor.id,
 *   actor.tenantId,
 *   userId,
 *   { users: ["set-role"] },
 * );
 */
export async function assertPermissionAndTenant(
	actorId: string,
	actorTenantId: string | null | undefined,
	targetUserId: string,
	permissions: Permissions,
	message = "Forbidden",
): Promise<void> {
	await assertPermission(actorId, permissions, message);

	await assertCanActOnUser(actorTenantId, targetUserId, message);
}

export function prettyPrintPermission(p: Permissions) {
	const formatted = Object.entries(p)
		.map(([resource, actions]) => `${resource}: [${actions.join(", ")}]`)
		.join(" | ");
	return "\n\nPermissions Required: `" + formatted + "`";
}

export async function hasPermission(
	userId: string,
	permissions: Permissions,
): Promise<boolean> {
	const data = await auth.api.userHasPermission({
		body: {
			userId,
			permissions,
		},
	});

	return data.success;
}
