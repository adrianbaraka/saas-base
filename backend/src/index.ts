import { Elysia } from "elysia";
import { users } from "@routes/v1/users/users";
import { betterAuthDocs, betterAuthRoute } from "@lib/auth";

export const app = new Elysia()
	.use(betterAuthRoute)
	.use(betterAuthDocs)
	.group("/v1", (v1) => v1.use(users))
	.listen(8000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
