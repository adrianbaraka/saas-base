import { status } from "elysia";
import {
	assertPermission,
	roles,
	roleDescriptions,
	modules,
} from "@lib/permissions";
import { User } from "@lib/auth";

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
