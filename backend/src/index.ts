import { Elysia, t } from "elysia";
import { betterAuthRoute, Docs } from "@lib/auth";
import { template } from "@routes/v1/template/template";
import { defaultAdmin, runMigrations } from "@lib/utils";
import { usersRoutes } from "@routes/v1/users/users";
import { tenantRoutes } from "@routes/v1/tenants/tenants";
import { betterAuthAdminRoutes } from "@routes/v1/admin/admin";
import { ApiError } from "@lib/errors";

const healthCheck = new Elysia().get("/health", () => ({ success: true }), {
	response: { 200: t.Object({ success: t.Boolean() }) },
	detail: { security: [] },
});

async function main() {
	// if prod dont mount docs and template
	const isProduction = process.env.NODE_ENV === "production";
	try {
		await runMigrations();
		console.log("Migrations applied successfully");
		await defaultAdmin();
	} catch (err) {
		console.error(err);
		process.exit(1);
	}

	const app = new Elysia()
		//handle thrown errors
		.onError(({ error, status }) => {
			if (error instanceof ApiError) {
				return status(error.status, {
					message: error.message,
				});
			}

			console.error(error);

			return status(500, {
				message: "Internal server error.",
			});
		})
		.use(healthCheck)
		.use(!isProduction ? Docs : (app) => app)
		.use(betterAuthRoute)
		.use(betterAuthAdminRoutes)
		.group("/api/v1", (v1) => {
			if (!isProduction) {
				v1.use(template);
			}
			v1.use(usersRoutes);
			v1.use(tenantRoutes);
			return v1;
		})
		.listen(8000);
	console.log(
		`Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
	);
}

void main();
