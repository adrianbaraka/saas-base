import Elysia, { t } from "elysia";
import {
	ErrorResponse,
	sessionResponseSchema,
	userResponseSchema,
} from "@lib/interfaces";

import {
	handleBanUser,
	handleCreateUser,
	handleGetUser,
	handleListUsers,
	handleListUserSessions,
	handleRevokeUserSession,
	handleRevokeUserSessions,
	handleSetRole,
	handleUnbanUser,
	handleUpdateUser,
} from "./admin.handlers";
import { authMacro, prettyPrintPermission } from "@lib/permissions/helpers";
import { TenantRoleSchema } from "@lib/permissions/roles";

const sharedErrorRes = {
	400: ErrorResponse,
	401: ErrorResponse,
	403: ErrorResponse,
	404: ErrorResponse,
	429: ErrorResponse,
	500: ErrorResponse,
};
/////////////////////////////////////////////////////
// Routes
/////////////////////////////////////////////////////

export const betterAuthAdminRoutes = new Elysia({
	prefix: "/api/auth/admin",
	detail: {
		security: [{ sessionAuth: [] }],
		description: "Admin actions",
	},
})
	.use(authMacro)

	.guard({ isAuthenticated: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// /admin/set-role
			/////////////////////////////////////////////////////
			.post(
				"/set-role",
				({ body: { role, userId }, user, request }) =>
					handleSetRole(user, request.headers, userId, role),
				{
					body: t.Object({
						role: TenantRoleSchema,
						userId: t.String(),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"Set the role of a user." +
							prettyPrintPermission({
								user: ["set-role"],
							}),
					},
					response: {
						200: t.Object({
							user: userResponseSchema,
						}),
						...sharedErrorRes,
					},
				},
			)

			/////////////////////////////////////////////////////
			// /admin/get-user
			/////////////////////////////////////////////////////
			.get(
				"get-user",
				({ query: { id }, user, request }) =>
					handleGetUser(user, id, request.headers),
				{
					query: t.Object({
						id: t.String(),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"Get an existing user" +
							prettyPrintPermission({ user: ["get"] }),
					},
					response: {
						200: userResponseSchema,
						...sharedErrorRes,
					},
				},
			)

			/////////////////////////////////////////////////////
			// /admin/unban-user
			/////////////////////////////////////////////////////
			.post(
				"unban-user",
				({ body: { userId }, user, request }) =>
					handleUnbanUser(user, userId, request.headers),
				{
					body: t.Object({
						userId: t.String(),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"Unban a user" +
							prettyPrintPermission({ user: ["ban"] }),
					},

					response: {
						200: t.Object({
							user: userResponseSchema,
						}),
						...sharedErrorRes,
					},
				},
			)

			/////////////////////////////////////////////////////
			// /admin/ban-user
			/////////////////////////////////////////////////////
			.post(
				"ban-user",
				({
					body: { userId, banReason, banExpiresIn },
					user,
					request,
				}) =>
					handleBanUser(
						user,
						userId,
						request.headers,
						banReason,
						banExpiresIn,
					),
				{
					body: t.Object({
						userId: t.String(),
						banReason: t.Optional(t.String()),
						banExpiresIn: t.Optional(t.Number()),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"Ban a user" +
							prettyPrintPermission({ user: ["ban"] }),
					},
					response: {
						200: t.Object({
							user: userResponseSchema,
						}),
						...sharedErrorRes,
					},
				},
			)

			/////////////////////////////////////////////////////
			// /admin/revoke-user-session
			/////////////////////////////////////////////////////
			.post(
				"revoke-user-session",
				({ body: { sessionToken }, user, request }) =>
					handleRevokeUserSession(
						user,
						sessionToken,
						request.headers,
					),
				{
					body: t.Object({
						sessionToken: t.String(),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"Revoke a specific session" +
							prettyPrintPermission({ session: ["revoke"] }),
					},
					response: {
						200: t.Object({ success: t.Boolean() }),
						...sharedErrorRes,
					},
				},
			)
			/////////////////////////////////////////////////////
			// /admin/revoke-user-sessions
			/////////////////////////////////////////////////////
			.post(
				"revoke-user-sessions",
				({ body: { userId }, user, request }) =>
					handleRevokeUserSessions(user, userId, request.headers),
				{
					body: t.Object({
						userId: t.String(),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"Revoke all sessions for a user" +
							prettyPrintPermission({
								session: ["delete"],
							}),
					},
					response: {
						200: t.Object({ success: t.Boolean() }),
						...sharedErrorRes,
					},
				},
			)

			/////////////////////////////////////////////////////
			// /admin/list-user-sessions
			/////////////////////////////////////////////////////
			.post(
				"list-user-sessions",
				({ body: { userId }, user, request }) =>
					handleListUserSessions(user, userId, request.headers),
				{
					body: t.Object({
						userId: t.String(),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"List all sessions for a user" +
							prettyPrintPermission({ session: ["list"] }),
					},
					response: {
						200: t.Object({
							sessions: t.Array(sessionResponseSchema),
						}),
						...sharedErrorRes,
					},
				},
			)

			/////////////////////////////////////////////////////
			// /admin/list-users
			/////////////////////////////////////////////////////
			.get(
				"list-users",
				({ query, user }) => handleListUsers(user, query),
				{
					query: t.Object({
						searchValue: t.Optional(t.String()),
						limit: t.Optional(t.Number()),
						offset: t.Optional(t.Number()),
						sortBy: t.Optional(t.String()),
						sortDirection: t.Optional(
							t.Union([t.Literal("asc"), t.Literal("desc")]),
						),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"List users in the actor's tenant" +
							prettyPrintPermission({ user: ["list"] }),
					},
					response: {
						200: t.Object({
							users: t.Array(userResponseSchema),
							total: t.Number(),
							limit: t.Number(),
							offset: t.Number(),
						}),
						...sharedErrorRes,
					},
				},
			)

			/////////////////////////////////////////////////////
			// /admin/create-user
			/////////////////////////////////////////////////////
			.post(
				"create-user",
				({ body: { email, name, role, data }, user, request }) =>
					handleCreateUser(
						user,
						request.headers,
						email,
						name,
						role,
						data,
					),
				{
					body: t.Object({
						email: t.String({ format: "email" }),
						name: t.String(),
						role: TenantRoleSchema,
						data: t.Optional(t.Record(t.String(), t.Unknown())),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"Create a new user in the actor's tenant (invite flow, no password set)." +
							prettyPrintPermission({ user: ["create"] }),
					},
					response: {
						200: t.Object({ user: userResponseSchema }),
						...sharedErrorRes,
					},
				},
			)

			/////////////////////////////////////////////////////
			// /admin/update-user
			/////////////////////////////////////////////////////
			.post(
				"update-user",
				({ body: { userId, data }, user, request }) =>
					handleUpdateUser(user, userId, data, request.headers),
				{
					body: t.Object({
						userId: t.String(),
						data: t.Record(t.String(), t.Unknown()),
					}),
					detail: {
						tags: ["Admin"],
						description:
							"Update a user's editable fields within the actor's tenant." +
							prettyPrintPermission({ user: ["update"] }),
					},
					response: {
						200: t.Object({ user: userResponseSchema }),
						...sharedErrorRes,
					},
				},
			),
	);
