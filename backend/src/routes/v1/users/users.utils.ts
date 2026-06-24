import { status } from "elysia";
import {
	addRoleToUser,
	listUsers,
	queryUser,
	removeRoleFromUser,
} from "@lib/db/queries";
import { User } from "@lib/auth";
import { requireRole, roleExists, roles } from "@lib/roles";
import { OrderBy } from "@lib/interfaces";

// returns all users
export async function handleAllUsers(
	currentUser: User,
	limit?: number,
	offset?: number,
	orderBy?: OrderBy,
) {
	const forbidden = requireRole([roles.Admin], currentUser);
	if (forbidden) return forbidden;
	return listUsers({
		limit,
		offset,
		orderBy,
	});
}

// get a single user
export async function handleGetUser(id: string, currentUser: User) {
	// Only allow users to fetch themselves, unless they are an admin
	const isAdmin = currentUser.roles?.includes("admin");
	const isSelf = currentUser.id === id;

	if (!isSelf && !isAdmin) {
		return status(404, {
			error: `User '${id}' not found.`,
		});
	}
	const u = await queryUser(id);
	if (!u) {
		return status(404, {
			error: `User '${id}' not found.`,
		});
	}
	return u;
}

// handles adding the role to the userid provided
export async function handleAddRole(
	role: string,
	userIdToAdd: string,
	currentUser: User,
) {
	// only an admin can add roles
	const forbidden = requireRole([roles.Admin], currentUser);
	if (forbidden) {
		return forbidden;
	}
	// verify role exists
	if (!roleExists(role)) {
		return status(404, { error: `Role '${role}' not found.` });
	}

	// verify the user exists
	const userToPatch = await queryUser(userIdToAdd);
	if (!userToPatch) {
		return status(404, { error: `User ${userIdToAdd} not found,` });
	}

	// verify user does not already have the role
	if (userToPatch.roles.includes(role)) {
		return userToPatch;
	}

	// add the role
	const newUSer = await addRoleToUser(userIdToAdd, role);
	if (!newUSer) {
		return status(404, {
			error: "An unexpected error occurred try again later,",
		});
	}

	return newUSer;
}

export function handleGetRoles(currentUser: User) {
	// only for admins
	const forbidden = requireRole([roles.Admin], currentUser);
	if (forbidden) {
		return forbidden;
	}

	return Object.values(roles);
}

// handles removing the role from the userid provided
export async function handleRemoveRole(
	role: string,
	userIdToModify: string,
	currentUser: User,
) {
	// only an admin can remove roles
	const forbidden = requireRole([roles.Admin], currentUser);
	if (forbidden) {
		return forbidden;
	}

	// verify the user exists
	const userToPatch = await queryUser(userIdToModify);
	if (!userToPatch) {
		return status(404, { error: `User ${userIdToModify} not found,` });
	}

	// verify user has the role
	if (!userToPatch.roles.includes(role)) {
		return userToPatch;
	}

	// remove the role
	const newUser = await removeRoleFromUser(userIdToModify, role);
	if (!newUser) {
		return status(404, {
			error: "An unexpected error occurred try again later,",
		});
	}

	return newUser;
}
