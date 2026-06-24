import { createSelectSchema } from "drizzle-typebox";
import { Static, t } from "elysia";
import { user } from "./db/schema/auth-schema";

// error response interface
export const ErrorResponse = t.Object({
	error: t.String(),
});

export const stringListResponse = t.Array(t.String());

export const UserSelectSchema = createSelectSchema(user);

export const orderByUnion = t.Union(
	[
		t.Literal("createdAt"),
		t.Literal("name"),
		t.Literal("email"),
		t.Literal("updatedAt"),
	],
	{ default: "createdAt" },
);

export const OrderByOptions = t.Optional(orderByUnion);

export type OrderBy = Static<typeof orderByUnion>;
