import { auth } from "@lib/auth";
import { ErrorResponse, ForbiddenError, UnauthorizedError } from "@lib/errors";
import { APIError } from "better-auth/api";
import { Elysia, t } from "elysia";
import { Permissions } from "./permissions";

export const authMacro = new Elysia({ name: "auth-macro" }).macro({
	auth: {
		response: { 401: ErrorResponse },
		async derive({ request: { headers } }) {
			const session = await auth.api.getSession({
				headers,
			});
			if (!session) throw new UnauthorizedError();
			return {
				user: session.user,
				session: session.session,
			};
		},
	},
});

// 0104
export function roleSchemaFrom<const T extends Record<string, unknown>>(
	roles: T,
) {
	const keys = Object.keys(roles) as (keyof T & string)[];
	return t.UnionEnum(keys as [keyof T & string, ...(keyof T & string)[]]);
}

export async function assertOrgPermission(
	headers: Headers,
	organizationId: string, // from the path, never the active org
	permissions: Permissions,
	message = "Forbidden",
): Promise<void> {
	try {
		const data = await auth.api.hasPermission({
			headers,
			body: { organizationId, permissions },
		});
		if (data.success) return;
	} catch (e) {
		// not a member of that org (or no session context): same as "not allowed"
		if (!(e instanceof APIError)) throw e;
	}
	throw new ForbiddenError(message);
}
