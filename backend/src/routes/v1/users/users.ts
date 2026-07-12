import Elysia, { t } from "elysia";
import { ErrorResponse } from "@lib/interfaces";
import { authMacro, prettyPrintPermission } from "@lib/permissions";
import {
	getUserStats,
	handleGetRoles,
	handleGetRolesFull,
	handleSendWelcomeEmail,
} from "./users.handlers";

/////////////////////////////////////////////////////
// Routes
/////////////////////////////////////////////////////

export const usersRoutes = new Elysia({
	prefix: "/users",
	detail: {
		security: [{ sessionAuth: [] }],
	},
})
	.use(authMacro)

	.guard({ isAuthenticated: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// GET /users/stats
			/////////////////////////////////////////////////////
			.get("/stats", ({ user }) => getUserStats(user), {
				detail: {
					tags: ["Users"],
					description:
						"Get statistics from the user table" +
						prettyPrintPermission({ user: ["list"] }),
				},
				response: {
					200: t.Object({
						totalUsers: t.Number(),
						bannedUsers: t.Number(),
						unverifiedUsers: t.Number(),
						adminUsers: t.Number(),
					}),
					401: ErrorResponse,
					403: ErrorResponse,
					404: ErrorResponse,
				},
			})
			/////////////////////////////////////////////////////
			// GET /users/roles
			/////////////////////////////////////////////////////
			.get("/roles", ({ user }) => handleGetRoles(user), {
				detail: {
					tags: ["Users"],
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
			// GET /users/roles/full
			/////////////////////////////////////////////////////
			.get("/roles/full", ({ user }) => handleGetRolesFull(user), {
				detail: {
					tags: ["Users"],
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
			})
			/////////////////////////////////////////////////////
			// POST /users/send-welcome
			/////////////////////////////////////////////////////
			.post(
				"/send-welcome",
				({ body: { email, redirectTo }, user }) =>
					handleSendWelcomeEmail(user, email, redirectTo),
				{
					body: t.Object({
						email: t.String(),
						redirectTo: t.String(),
					}),
					detail: {
						tags: ["Users"],
						description:
							"Send a welcome email to the user with a link to set their password." +
							prettyPrintPermission({ user: ["create"] }),
					},
					response: {
						202: t.Object({
							success: t.Boolean(),
						}),
						400: ErrorResponse,
						401: ErrorResponse,
						403: ErrorResponse,
						404: ErrorResponse,
						429: ErrorResponse,
					},
				},
			),
	);
