import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";
import { roleSchemaFrom } from "./helpers";

const statement = {
	...defaultStatements,
	member: ["create", "update", "delete", "read"],
	roles: ["list"],
	activity: ["read"],
} as const;
type Statement = typeof statement;
export type Permissions = {
	[K in keyof Statement]?: Statement[K][number][];
};

export const ac = createAccessControl(statement);
const admin = ac.newRole({
	organization: ["update"],
	invitation: ["create", "cancel"],
	member: ["create", "update", "delete", "read"],
	team: ["create", "update", "delete"],
	ac: ["create", "read", "update", "delete"],
	roles: ["list"],
	activity: ["read"],
});

const owner = ac.newRole({
	organization: ["update"],
	invitation: ["create", "cancel"],
	member: ["create", "update", "delete", "read"],
	roles: ["list"],
	activity: ["read"],
});
const member = ac.newRole({});

export const orgRoles = {
	admin,
	member,
};
export const orgRoleSchema = roleSchemaFrom(orgRoles);
export type orgRoleType = keyof typeof orgRoles;

export const Fullroles = {
	owner,
	...orgRoles,
};
export const FullRoleSchema = roleSchemaFrom(Fullroles);
export type FullRoleType = keyof typeof Fullroles;

export const roleDescriptions: Record<FullRoleType, string> = {
	admin: "An administrator in an organization.",
	owner: "The owner of the organization.",
	member: "A member in the organization.",
};
