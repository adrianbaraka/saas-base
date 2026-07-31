import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { t } from "elysia";

// system modules
export const statement = {
	...defaultStatements,
	roles: ["list", "list-full"],
	tenants: ["create", "update", "list", "delete", "get"],
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

export const platformAdmin = ac.newRole({
	tenants: ["create", "list", "delete", "get"],
	user: ["create"],
	roles: ["list-full"],
});
export const requestor = ac.newRole({});

export const fullRoles = { user, admin, platformAdmin, requestor };
export const tenantRoles = { user, admin };

export const FullRoleSchema = t.UnionEnum([
	"user",
	"admin",
	"platformAdmin",
	"requestor",
]);
export const TenantRoleSchema = t.UnionEnum(["user", "admin"]);

export type FullRole = keyof typeof fullRoles;
export type TenantRole = keyof typeof tenantRoles;

export const fullModules: Record<string, readonly string[]> = statement;
export const tenantModules: Record<string, readonly string[]> =
	Object.fromEntries(
		Object.entries(statement).filter(([key]) => key !== "tenants"),
	);

export const roleDescriptions: Record<FullRole, string> = {
	user: "Standard user with access to their own resources.",
	admin: "Full administrative access, including user management, roles, and system settings within their org.",
	platformAdmin: "Platform admin that manages organizations.",
	requestor: "Allows a user to request for tenancy.",
};
