import { OrderBy } from "@lib/interfaces";
import { db } from ".";
import { user } from "./schema/auth-schema";
import { and, eq, sql, asc } from "drizzle-orm";

// get info on all users
const orderByColumn = {
	name: user.name,
	email: user.email,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
} as const;

export async function listUsers({
	limit = 50,
	offset = 0,
	orderBy = "createdAt",
}: {
	limit?: number;
	offset?: number;
	orderBy?: OrderBy;
} = {}) {
	return db
		.select()
		.from(user)
		.orderBy(asc(orderByColumn[orderBy]))
		.limit(limit)
		.offset(offset);
}

// get info on a specific user
export async function queryUser(id: string) {
	const [foundUser] = await db
		.select()
		.from(user)
		.where(eq(user.id, id))
		.limit(1);
	return foundUser ?? null;
}

// add the role to the user passed
export async function addRoleToUser(
	targetUserId: string,
	roleToAppend: string,
) {
	const [updatedUser] = await db
		.update(user)
		.set({
			// Removes the role if it exists, then appends it safely at the end
			roles: sql`array_append(array_remove(${user.roles}, ${roleToAppend}), ${roleToAppend})`,
		})
		.where(eq(user.id, targetUserId))
		.returning();

	return updatedUser ?? null;
}

// remove role from user
export async function removeRoleFromUser(
	targetUserId: string,
	roleToRemove: string,
) {
	const [updatedUser] = await db
		.update(user)
		.set({
			roles: sql`array_remove(${user.roles}, ${roleToRemove})`,
		})
		.where(
			and(
				eq(user.id, targetUserId),
				sql`array_length(${user.roles}, 1) > 1`,
			),
		)
		.returning();

	return updatedUser ?? null;
}
