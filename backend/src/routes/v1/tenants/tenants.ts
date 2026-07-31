import Elysia, { t } from "elysia";
import { authMacro, prettyPrintPermission } from "@lib/permissions/helpers";
import {
	handleAcceptRequest,
	handleCreateTenant,
	handleGetRequest,
	handleGetStats,
	handleGetTenant,
	handleListRequests,
	handleListTenants,
	handleRejectRequest,
	handleRequestTenancy,
} from "./tenants.handlers";
import { ErrorResponse, userResponseSchema } from "@lib/interfaces";

/////////////////////////////////////////////////////
// Routes
/////////////////////////////////////////////////////

export const tenantRoutes = new Elysia({
	prefix: "/tenants",
	detail: {
		security: [{ sessionAuth: [] }],
		description: "System platform routes",
	},
})
	.use(authMacro)

	/////////////////////////////////////////////////////
	// POST /request-tenancy [ does not require auth]
	/////////////////////////////////////////////////////
	.post("/request-tenancy", ({ body }) => handleRequestTenancy(body), {
		body: t.Object({
			fullName: t.String(),
			email: t.String({ format: "email" }),
			password: t.String({ minLength: 8 }),
			orgName: t.String({ minLength: 3 }),
		}),
		detail: {
			tags: ["Tenancy Request"],
			description:
				"Submit a request to create a new tenant/org. \n\nRequires requestor role.",
		},
		response: {
			200: t.Object({
				request: t.Object({
					id: t.String(),
					requestedBy: t.Nullable(t.String()),
					name: t.String(),
					status: t.Optional(
						t.Union([
							t.Literal("pending"),
							t.Literal("approved"),
							t.Literal("rejected"),
						]),
					),
					createdAt: t.Date(),
					updatedAt: t.Date(),
					reviewedAt: t.Optional(t.Nullable(t.Date())),
					rejectionReason: t.Optional(t.Nullable(t.String())),
				}),
			}),
			401: ErrorResponse,
			403: ErrorResponse,
			409: ErrorResponse,
			500: ErrorResponse,
		},
	})

	.guard({ isAuthenticated: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// POST /tenants
			/////////////////////////////////////////////////////
			.post(
				"",
				({ body: { name }, user }) => handleCreateTenant(user, name),
				{
					body: t.Object({
						name: t.String({ minLength: 1 }),
					}),
					detail: {
						tags: ["Tenant"],
						description:
							"Create a new tenant" +
							prettyPrintPermission({ tenants: ["create"] }),
					},
					response: {
						200: t.Object({
							tenant: t.Object({
								id: t.String(),
								name: t.String(),
								createdAt: t.Date(),
								updatedAt: t.Date(),
							}),
						}),
						401: ErrorResponse,
						403: ErrorResponse,
						500: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// GET /tenants/:id
			/////////////////////////////////////////////////////
			.get(
				":id",
				({ params: { id }, user }) => handleGetTenant(user, id),
				{
					params: t.Object({
						id: t.String(),
					}),
					detail: {
						tags: ["Tenant"],
						description:
							"Get a single tenant with user stats" +
							prettyPrintPermission({ tenants: ["get"] }),
					},
					response: {
						200: t.Object({
							tenant: t.Object({
								id: t.String(),
								name: t.String(),
								createdAt: t.Date(),
								updatedAt: t.Date(),
							}),
							totalUsers: t.Number(),
						}),
						403: ErrorResponse,
						404: ErrorResponse,
						500: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// GET /tenants
			/////////////////////////////////////////////////////
			.get("", ({ query, user }) => handleListTenants(user, query), {
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
					tags: ["Tenant"],
					description:
						"List all tenants" +
						prettyPrintPermission({ tenants: ["list"] }),
				},
				response: {
					200: t.Object({
						tenants: t.Array(
							t.Object({
								id: t.String(),
								name: t.String(),
								createdAt: t.Date(),
								updatedAt: t.Date(),
							}),
						),
						total: t.Number(),
						limit: t.Number(),
						offset: t.Number(),
					}),
					403: ErrorResponse,
					500: ErrorResponse,
				},
			})

			/////////////////////////////////////////////////////
			// GET /list-requests
			/////////////////////////////////////////////////////
			.get(
				"/list-requests",
				({ query, user }) => handleListRequests(user, query),
				{
					query: t.Object({
						filter: t.Optional(
							t.Union([
								t.Literal("pending"),
								t.Literal("approved"),
								t.Literal("rejected"),
							]),
						),
						searchValue: t.Optional(t.String()),
						limit: t.Optional(t.Number()),
						offset: t.Optional(t.Number()),
						sortBy: t.Optional(t.String()),
						sortDirection: t.Optional(
							t.Union([t.Literal("asc"), t.Literal("desc")]),
						),
					}),
					detail: {
						tags: ["Tenancy Request"],
						description:
							"List tenant requests, optionally filtered by status and searchable by name." +
							prettyPrintPermission({ tenants: ["list"] }),
					},
					response: {
						200: t.Object({
							requests: t.Array(
								t.Object({
									id: t.String(),
									requestedBy: t.Nullable(t.String()),
									name: t.String(),
									status: t.Union([
										t.Literal("pending"),
										t.Literal("approved"),
										t.Literal("rejected"),
									]),
									createdAt: t.Date(),
									updatedAt: t.Date(),
									reviewedBy: t.Nullable(t.String()),
									reviewedAt: t.Nullable(t.Date()),
									rejectionReason: t.Nullable(t.String()),
								}),
							),
							total: t.Number(),
							limit: t.Number(),
							offset: t.Number(),
						}),
						401: ErrorResponse,
						403: ErrorResponse,
						500: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// POST /accept-request/:id
			/////////////////////////////////////////////////////
			.post(
				"/accept-request/:id",
				({ params: { id }, user }) => handleAcceptRequest(user, id),
				{
					params: t.Object({
						id: t.String(),
					}),
					detail: {
						tags: ["Tenancy Request"],
						description:
							"Approve a pending tenant request." +
							prettyPrintPermission({ tenants: ["create"] }),
					},
					response: {
						200: t.Object({
							tenant: t.Object({
								id: t.String(),
								name: t.String(),
								createdAt: t.Date(),
								updatedAt: t.Date(),
							}),
							user: userResponseSchema,
							request: t.Object({
								id: t.String(),
								requestedBy: t.Optional(t.Nullable(t.String())),
								name: t.String(),
								status: t.Literal("approved"),
								createdAt: t.Date(),
								updatedAt: t.Date(),
								reviewedBy: t.Optional(t.Nullable(t.String())),
								reviewedAt: t.Optional(t.Nullable(t.Date())),
								rejectionReason: t.Optional(
									t.Nullable(t.String()),
								),
							}),
						}),
						401: ErrorResponse,
						403: ErrorResponse,
						404: ErrorResponse,
						409: ErrorResponse,
						500: ErrorResponse,
					},
				},
			)
			/////////////////////////////////////////////////////
			// POST /reject-request/:id
			/////////////////////////////////////////////////////
			.post(
				"/reject-request/:id",
				({ params: { id }, body: { rejectionReason }, user }) =>
					handleRejectRequest(user, id, rejectionReason),
				{
					params: t.Object({
						id: t.String(),
					}),
					body: t.Object({
						rejectionReason: t.String({ minLength: 1 }),
					}),
					detail: {
						tags: ["Tenancy Request"],
						description:
							"Reject a pending tenant request." +
							prettyPrintPermission({ tenants: ["create"] }),
					},
					response: {
						200: t.Object({
							request: t.Object({
								id: t.String(),
								requestedBy: t.Optional(t.Nullable(t.String())),
								name: t.String(),
								status: t.Literal("rejected"),
								createdAt: t.Date(),
								updatedAt: t.Date(),
								reviewedBy: t.Optional(t.Nullable(t.String())),
								reviewedAt: t.Optional(t.Nullable(t.Date())),
								rejectionReason: t.Optional(
									t.Nullable(t.String()),
								),
							}),
						}),
						401: ErrorResponse,
						403: ErrorResponse,
						404: ErrorResponse,
						409: ErrorResponse,
						500: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// GET /stats
			/////////////////////////////////////////////////////
			.get("/stats", ({ user }) => handleGetStats(user), {
				detail: {
					tags: ["Tenant"],
					description:
						"Get stats of all tenants in the system" +
						prettyPrintPermission({ tenants: ["list"] }),
				},
				response: {
					200: t.Object({
						totalUsers: t.Integer(),
						totalTenants: t.Integer(),
						newTenantsLast30Days: t.Integer(),
						pendingRequests: t.Integer(),
					}),
					401: ErrorResponse,
					403: ErrorResponse,
					500: ErrorResponse,
				},
			})

			/////////////////////////////////////////////////////
			// /request/:id
			/////////////////////////////////////////////////////
			.get(
				"/request/:id",
				({ params: { id }, user }) => handleGetRequest(user, id),
				{
					params: t.Object({
						id: t.String(),
					}),
					detail: {
						tags: ["Tenancy Request"],
						description:
							"Get a single tenant request." +
							prettyPrintPermission({ tenants: ["get"] }),
					},
					response: {
						200: t.Object({
							request: t.Object({
								id: t.String(),
								requestedBy: t.Nullable(t.String()),
								name: t.String(),
								status: t.Union([
									t.Literal("pending"),
									t.Literal("approved"),
									t.Literal("rejected"),
								]),
								createdAt: t.Date(),
								updatedAt: t.Date(),
								reviewedBy: t.Nullable(t.String()),
								reviewedAt: t.Nullable(t.Date()),
								rejectionReason: t.Nullable(t.String()),
							}),
						}),
						403: ErrorResponse,
						404: ErrorResponse,
						500: ErrorResponse,
					},
				},
			),
	);
