/* eslint-disable @typescript-eslint/require-await */
import { t, Static } from "elysia";
import { User } from "@lib/auth";
import { assertPermission } from "@lib/permissions";
import {status } from "elysia"

/////////////////////////////////////////////////////
// Schemas + inferred types
/////////////////////////////////////////////////////

export const WithParamsSchema = t.Object({ id: t.String() });
export type WithParamsInput = Static<typeof WithParamsSchema>;

export const WithQuerySchema = t.Object({
	q: t.String(),
	limit: t.Optional(t.Number({ default: 20 })),
});
export type WithQueryInput = Static<typeof WithQuerySchema>;

export const WithBodySchema = t.Object({
	name: t.String(),
	description: t.Optional(t.String()),
});
export type WithBodyInput = Static<typeof WithBodySchema>;

export async function handleNoInput() {
	return { message: "ok" };
}

export async function handleWithParams(id: string, user: User) {
	const err = await assertPermission(user.id, { user: ["list"] });
	if (err) return status(403, { error: err.message });

	return { id };
}

export async function handleWithQuery(
	q: WithQueryInput["q"],
	limit: WithQueryInput["limit"],
	user: User,
) {
	console.log(q, limit, user);

	return [];
}

export async function handleWithBody(
	name: WithBodyInput["name"],
	description: WithBodyInput["description"],
	user: User,
) {
	console.log(description, user);

	return { id: "new-id", name };
}
