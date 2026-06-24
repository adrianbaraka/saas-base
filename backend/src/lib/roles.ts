import { User } from "./auth";
import { status } from "elysia";

// prettier-ignore
export enum roles {
    // general roles
	User = "user", Admin = "admin",
}

export function requireRole(requiredRoles: roles[], user: User) {
    const hasRole = user.roles?.some((role) =>
        requiredRoles.includes(role as roles)
    );

    if (!hasRole) {
        return status(403, { error: "Forbidden" });
    }
}

// check if a role exists
export function roleExists(role: string): role is roles {
	return Object.values(roles).includes(role as roles);
}

// print in markdown for the openapi docs
export function prettyPrintRoles(...rls: string[]) {
	return "\n\n**Required Roles (any):**" + " `" + rls + "`"
}
