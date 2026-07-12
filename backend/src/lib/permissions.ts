import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { auth } from "./auth";
import { Elysia } from "elysia"

// checks that user is authenticated
export const authMacro = new Elysia({ name: "auth-macro" }).macro({
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	isAuthenticated: (_enabled: boolean) => ({
		async resolve({ status, request: { headers } }) {
			const session = await auth.api.getSession({ headers });
			if (!session) return status(401, { error: "Unauthenticated." });

			return {
				user: session.user,
				session: session.session,
			};
		},
	}),
});

// system modules for example the module roles has the permissions list etc...
const statement = {
	...defaultStatements,
	roles: ["list"],
} as const;

export const ac = createAccessControl(statement);

/// Roles in the app
//to add a new role follow the format as shown with the permissions they have in the different modules
export const user = ac.newRole({});

export const admin = ac.newRole({
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		// "impersonate",
		"delete",
		//"set-password", // no one can set another users password even admins
		//"set-email",
		"get",
		"update",
	],
	session: ["list", "revoke", "delete"],
	roles: ["list"],
});

export const roles = { user, admin };
export const roleDescriptions: Record<keyof typeof roles, string> = {
	user: "Standard user with access to their own resources.",
	admin: "Full administrative access, including user management, roles, and system settings.",
};
export const modules: Record<string, readonly string[]> = statement;

/////////////////////////////////////////////////////////
// helper functions

type Statement = typeof statement;
type Permissions = {
	[K in keyof Statement]?: Statement[K][number][];
};

/**
 * // asserts that the user has the necessary permissions and returns null else returns 403 with message passed
 * @example 	const err = await assertPermission(user.id, { template: ["delete"] });
	if (err) return status(403, { error: err.message });
 */
export async function assertPermission(
	userId: string,
	permissions: Permissions,
	message = "Forbidden",
): Promise<Error | null> {
	const data = await auth.api.userHasPermission({
		body: { userId: userId, permissions },
	});

	if (!data.success) {
		return new Error(message);
	}
	return null;
}

export function prettyPrintPermission(p: Permissions) {
	const formatted = Object.entries(p)
		.map(([resource, actions]) => `${resource}: [${actions.join(", ")}]`)
		.join(" | ");
	return "\n\nPermissions Required: `" + formatted + "`";
}
