import { Elysia } from "elysia";
import { fromTypes, openapi } from "@elysia/openapi";
import path from "node:path";
import { csrf, runMigrations } from "@lib/utils";
import { auth, OpenAPI, trustedOrigins } from "@lib/auth";
import { toErrorReply } from "@lib/errors";
import { defaultAdmin } from "@lib/services/users.services";
import { orgMemberRoutes } from "@routes/admin/admin";
import { MemberRoutes } from "@routes/member/member";
import { platformAdminRoutes } from "@routes/platformAdmin/platform"

const isProduction = process.env.NODE_ENV === "production";
const healthCheck = new Elysia().get(
	"/health",
	{
		detail: { security: [] },
	},
	() => ({ success: true }),
);
// try and run migrations on startup
try {
	if (process.env.SKIP_MIGRATIONS) {
		console.log("Skipping migrations.");
	} else {
		await runMigrations();
		console.log("Migrations applied successfully");
	}
	await defaultAdmin();
} catch (err) {
	console.error(err);
	process.exit(1);
}

export const app = new Elysia()
	.onError(({ error, status }) => {
		const reply = toErrorReply(error);
		return status(reply.status, reply.body);
	})
	.use(
		csrf({
			trustedOrigins: trustedOrigins,
			skipPaths: [], // signed callbacks, not browser traffic
		}),
	)
	.use(
		openapi({
			references: fromTypes("src/index.ts", {
				projectRoot: path.join(import.meta.dir, ".."),
				debug: true,
			}),
			enabled: !isProduction,
			documentation: {
				info: {
					title: "Saas base",
					version: "0.0.1",
				},
				components: await OpenAPI.components,
				paths: await OpenAPI.getPaths(),
			},
		}),
	)
	.use(healthCheck)
	.mount(auth.handler)
	.group("/api/v1", (v1) =>
		v1
			.use(platformAdminRoutes)
			.use(orgMemberRoutes)
			.use(MemberRoutes),
	)
	.listen(8000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
