// example permissions wth multiple roles

import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { auth } from "./auth";

// system modules for example the module roles has the permissions list etc...
const statement = {
	...defaultStatements,
	roles: ["list"],
	projects: ["create", "read", "update", "delete", "archive"],
	billing: ["view", "manage", "refund"],
	reports: ["view", "export", "schedule"],
	teams: ["invite", "remove", "manage"],
	settings: ["view", "update"],
	audit_logs: ["view", "export"],
} as const;

export const ac = createAccessControl(statement);

/// Roles in the app
//to add a new role follow the format as shown with the permissions they have in the different modules

export const user = ac.newRole({
	projects: ["read"],
	reports: ["view"],
});

export const admin = ac.newRole({
	...adminAc.statements,
	roles: ["list"],
	projects: ["create", "read", "update", "delete", "archive"],
	billing: ["view", "manage", "refund"],
	reports: ["view", "export", "schedule"],
	teams: ["invite", "remove", "manage"],
	settings: ["view", "update"],
	audit_logs: ["view", "export"],
});

export const superadmin = ac.newRole({
	...adminAc.statements,
	roles: ["list"],
	projects: ["create", "read", "update", "delete", "archive"],
	billing: ["view", "manage", "refund"],
	reports: ["view", "export", "schedule"],
	teams: ["invite", "remove", "manage"],
	settings: ["view", "update"],
	audit_logs: ["view", "export"],
});

export const manager = ac.newRole({
	projects: ["create", "read", "update", "archive"],
	reports: ["view", "export", "schedule"],
	teams: ["invite", "remove", "manage"],
	settings: ["view"],
});

export const editor = ac.newRole({
	projects: ["create", "read", "update"],
	reports: ["view"],
});

export const viewer = ac.newRole({
	projects: ["read"],
	reports: ["view"],
	settings: ["view"],
});

export const billingAdmin = ac.newRole({
	billing: ["view", "manage", "refund"],
	reports: ["view", "export"],
});

export const support = ac.newRole({
	projects: ["read", "update"],
	teams: ["invite"],
	audit_logs: ["view"],
});

export const auditor = ac.newRole({
	audit_logs: ["view", "export"],
	reports: ["view", "export"],
	settings: ["view"],
});

export const contributor = ac.newRole({
	projects: ["read", "update"],
});

export const guest = ac.newRole({
	projects: ["read"],
});

export const roles = {
	user,
	admin,
	superadmin,
	manager,
	editor,
	viewer,
	billingAdmin,
	support,
	auditor,
	contributor,
	guest,
};

export const roleDescriptions: Record<keyof typeof roles, string> = {
	user: "Standard user with access to their own resources.",
	admin: "Full administrative access, including user management, roles, and system settings.",
	superadmin:
		"Highest level of access across the entire system, including all admin capabilities.",
	manager: "Manages projects, teams, and reporting for their department.",
	editor: "Can create and update projects but cannot delete or manage teams.",
	viewer: "Read-only access to projects, reports, and settings.",
	billingAdmin: "Manages billing, refunds, and financial reporting.",
	support:
		"Handles support tickets with limited project and audit log visibility.",
	auditor:
		"Reviews audit logs, reports, and settings for compliance purposes.",
	contributor: "Can view and update assigned projects only.",
	guest: "Minimal read-only access, typically for external collaborators.",
};

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

export const modules: Record<string, readonly string[]> = statement;
