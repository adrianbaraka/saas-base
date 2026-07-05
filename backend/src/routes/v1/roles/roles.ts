import Elysia, { t } from "elysia";
import { ErrorResponse } from "@lib/interfaces";
import { authMacro } from "@lib/auth";
import { prettyPrintPermission } from "@lib/permissions";
import { handleGetRoles, handleGetRolesFull } from "./roles.handlers";

/////////////////////////////////////////////////////
// Routes
/////////////////////////////////////////////////////

export const RolesRoutes = new Elysia({
	prefix: "/roles",
	detail: {
		security: [{ sessionAuth: [] }],
	},
})
	.use(authMacro)

	.guard({ isAuthenticated: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// GET /roles
			/////////////////////////////////////////////////////
			.get("", ({ user }) => handleGetRoles(user), {
				detail: {
					tags: ["Roles"],
					description:
						"Get all roles in the system and their descriptions" +
						prettyPrintPermission({ roles: ["list"] }),
				},
				response: {
					200: t.Array(
						t.Object({
							name: t.String(),
							description: t.String(),
						}),
					),
					401: ErrorResponse,
					403: ErrorResponse,
				},
			})
			/////////////////////////////////////////////////////
			// GET /roles/full
			/////////////////////////////////////////////////////
			// roles.routes.ts
			.get("/full", ({ user }) => handleGetRolesFull(user), {
				detail: {
					tags: ["Roles"],
					description:
						"Get all modules with their actions, and all roles with their granted permissions" +
						prettyPrintPermission({ roles: ["list"] }),
				},
				response: {
					200: t.Object({
						modules: t.Array(
							t.Object({
								module: t.String(),
								actions: t.Array(t.String()),
							}),
						),
						roles: t.Array(
							t.Object({
								role: t.String(),
								permissions: t.Record(
									t.String(),
									t.Array(t.String()),
								),
							}),
						),
					}),
					401: ErrorResponse,
					403: ErrorResponse,
				},
			}),
	);
