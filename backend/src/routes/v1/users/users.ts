import Elysia, { t } from "elysia";
import {
	ErrorResponse,
	OrderByOptions,
	stringListResponse,
	UserSelectSchema,
} from "@lib/interfaces";
import { authMacro } from "@lib/auth";
import { prettyPrintRoles } from "@lib/roles";
import {
	handleAddRole,
	handleAllUsers,
	handleGetRoles,
	handleGetUser,
	handleRemoveRole,
} from "./users.utils";
export const users = new Elysia({
	prefix: "/users",
	detail: { security: [{ sessionAuth: [] }] },
})
	.use(authMacro)
	.guard({ isAuthenticated: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// GET /users - list all registred users
			/////////////////////////////////////////////////////
			.get(
				"",
				async ({ user, query: { limit, offset, orderBy } }) => {
					return await handleAllUsers(user, limit, offset, orderBy);
				},
				{
					query: t.Object({
						limit: t.Optional(
							t.Number({ default: 50, maximum: 100 }),
						),
						offset: t.Optional(t.Number({ default: 0 })),
						orderBy: t.Optional(OrderByOptions),
					}),
					detail: {
						tags: ["Users"],
						description: `Returns a list of all registered users in the system. ${prettyPrintRoles("admin")}`,
					},
					response: {
						200: t.Array(UserSelectSchema),
						401: ErrorResponse,
						403: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// GET /users/{id} - get details of a single user
			/////////////////////////////////////////////////////
			.get(
				"/:id",
				async ({ params: { id }, user }) => {
					return await handleGetUser(id, user);
				},
				{
					detail: {
						tags: ["Users"],
						description:
							"Get the details of a registered user.\n\nRequires admin or a user can get their own details.",
					},
					params: t.Object({
						id: t.String(),
					}),
					response: {
						200: UserSelectSchema,
						403: ErrorResponse,
						404: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// PATCH /users/addRole - add a role to a user
			/////////////////////////////////////////////////////
			.patch(
				"/addRole",
				async ({ body: { userId, role }, user }) => {
					return await handleAddRole(role, userId, user);
				},
				{
					body: t.Object({
						userId: t.String(),
						role: t.String(),
					}),
					detail: {
						tags: ["Users"],
						description: `Add the role passed to the userId passed. ${prettyPrintRoles("admin")}`,
					},
					response: {
						200: UserSelectSchema,
						403: ErrorResponse,
						404: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// PATCH /users/removeRole - remove a role from a user
			/////////////////////////////////////////////////////
			.patch(
				"/removeRole",
				async ({ body: { userId, role }, user }) => {
					return await handleRemoveRole(role, userId, user);
				},
				{
					body: t.Object({
						userId: t.String(),
						role: t.String(),
					}),
					detail: {
						tags: ["Users"],
						description: `Remove the role passed from the userId passed. ${prettyPrintRoles("admin")}`,
					},
					response: {
						200: UserSelectSchema,
						403: ErrorResponse,
						404: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// GET /roles - get all roles in system
			/////////////////////////////////////////////////////
			.get(
				"/roles",
				({ user }) => {
					return handleGetRoles(user);
				},
				{
					detail: {
						tags: ["Users"],
						description: `Returns all roles available in the system. ${prettyPrintRoles("admin")}`,
					},
					response: {
						200: stringListResponse,
						401: ErrorResponse,
						403: ErrorResponse,
					},
				},
			),
	);
