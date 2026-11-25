import { authMacro } from "@lib/security/helpers";
import Elysia, { t } from "elysia";
import {
	createPlatformAdminHandler,
	getOrganizationHandler,
	getPendingWorkHandler,
	getPlatformAdminHandler,
	getPlatformStatsHandler,
	listOrganizationsHandler,
	listPlatformAdminsHandler,
	resendPlatformWelcomeHandler,
} from "./platform.handlers";
import { ErrorResponse } from "@lib/errors";
import {
	approveOrgRequestHandler,
	createOrganizationForUserHandler,
	listOrgRequestsHandler,
	rejectOrgRequestHandler,
	submitOrgRequestHandler,
} from "./orgRequest.handlers";
import { listPlatformActivityModulesHandler } from "@lib/services/activity.service";
import {
	activityQuerySchema,
	listPlatformActivitiesHandler,
} from "@routes/activity/activity.handlers";

export const platformAdminRoutes = new Elysia({})
	/////////////////////////////////////////////////////
	// POST /api/v1/org-requests [unauthenticated]
	/////////////////////////////////////////////////////
	.post(
		"/org-requests",
		{
			body: t.Object({
				requesterName: t.String({ minLength: 2, maxLength: 100 }),
				email: t.String({ format: "email", maxLength: 254 }),
				organizationName: t.String({ minLength: 2, maxLength: 100 }),
			}),
			detail: {
				description: "Request a new organization",
				tags: ["Org Requests"],
			},
		},
		({ body }) => submitOrgRequestHandler(body),
	)
	.use(authMacro)
	.guard({ auth: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/users
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/users",
				{
					query: t.Object({
						searchValue: t.Optional(t.String()),
						emailVerified: t.Optional(t.Boolean()),
						limit: t.Optional(t.Number()),
						offset: t.Optional(t.Number()),
						sortBy: t.Optional(t.String()),
						sortDirection: t.Optional(
							t.Union([t.Literal("asc"), t.Literal("desc")]),
						),
					}),
					detail: {
						description: "List platform admins",
						tags: ["Platform Admin"],
					},
					response: { 403: ErrorResponse },
				},
				({ query, user }) => listPlatformAdminsHandler(user, query),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/users/:id
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/users/:id",
				{
					params: t.Object({
						id: t.String(),
					}),
					detail: {
						description: "Get a platform admin by id",
						tags: ["Platform Admin"],
					},
					response: { 403: ErrorResponse, 404: ErrorResponse },
				},
				({ params, user }) => getPlatformAdminHandler(user, params.id),
			)

			/////////////////////////////////////////////////////
			// POST /api/v1/platform-admin/users
			/////////////////////////////////////////////////////
			.post(
				"/platform-admin/users",
				{
					body: t.Object({
						email: t.String({ format: "email" }),
						name: t.String({ minLength: 1, maxLength: 100 }),
					}),
					detail: {
						description:
							"Create a platform admin and email them a link to set their password",
						tags: ["Platform Admin"],
					},
					response: { 403: ErrorResponse, 409: ErrorResponse },
				},
				({ body, user }) => createPlatformAdminHandler(user, body),
			)

			/////////////////////////////////////////////////////
			// POST /api/v1/platform-admin/users/resend-welcome
			/////////////////////////////////////////////////////
			.post(
				"/platform-admin/users/resend-welcome",
				{
					body: t.Object({
						email: t.String({ format: "email" }),
					}),
					detail: {
						description:
							"Resend the set-password email to a pending platform admin or org owner",
						tags: ["Platform Admin"],
					},
					response: {
						400: ErrorResponse,
						403: ErrorResponse,
						404: ErrorResponse,
						409: ErrorResponse,
					},
				},
				({ body, user }) => resendPlatformWelcomeHandler(user, body),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/org-requests
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/org-requests",
				{
					query: t.Object({
						searchValue: t.Optional(t.String()),
						status: t.Optional(
							t.Union([
								t.Literal("pending"),
								t.Literal("approving"),
								t.Literal("approved"),
								t.Literal("rejected"),
							]),
						),
						limit: t.Optional(t.Number()),
						offset: t.Optional(t.Number()),
						sortBy: t.Optional(t.String()),
						sortDirection: t.Optional(
							t.Union([t.Literal("asc"), t.Literal("desc")]),
						),
					}),
					detail: {
						description: "List organization requests",
						tags: ["Platform Admin"],
					},
					response: { 403: ErrorResponse },
				},
				({ query, user }) => listOrgRequestsHandler(user, query),
			)

			/////////////////////////////////////////////////////
			// POST /api/v1/platform-admin/org-requests/:id/reject
			/////////////////////////////////////////////////////
			.post(
				"/platform-admin/org-requests/:id/reject",
				{
					params: t.Object({ id: t.String() }),
					body: t.Object({
						reason: t.Optional(t.String({ maxLength: 500 })),
					}),
					detail: {
						description: "Reject a pending organization request",
						tags: ["Platform Admin"],
					},
					response: {
						403: ErrorResponse,
						404: ErrorResponse,
						409: ErrorResponse,
					},
				},
				({ params, body, user }) =>
					rejectOrgRequestHandler(user, params.id, body.reason),
			)

			/////////////////////////////////////////////////////
			// POST /api/v1/platform-admin/org-requests/:id/approve
			/////////////////////////////////////////////////////
			.post(
				"/platform-admin/org-requests/:id/approve",
				{
					params: t.Object({ id: t.String() }),
					detail: {
						description:
							"Approve an organization request: creates the owner account and the organization",
						tags: ["Platform Admin"],
					},
					response: {
						403: ErrorResponse,
						404: ErrorResponse,
						409: ErrorResponse,
					},
				},
				({ params, user }) => approveOrgRequestHandler(user, params.id),
			)

			/////////////////////////////////////////////////////
			// POST /api/v1/platform-admin/organizations
			/////////////////////////////////////////////////////
			.post(
				"/platform-admin/organizations",
				{
					body: t.Object({
						ownerName: t.String({ minLength: 2, maxLength: 100 }),
						email: t.String({ format: "email", maxLength: 254 }),
						organizationName: t.String({
							minLength: 2,
							maxLength: 100,
						}),
					}),
					detail: {
						description:
							"Create an organization for an owner without a request: creates the owner account if needed",
						tags: ["Platform Admin"],
					},
					response: {
						400: ErrorResponse,
						403: ErrorResponse,
						409: ErrorResponse,
					},
				},
				({ body, user }) =>
					createOrganizationForUserHandler(user, body),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/organizations
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/organizations",
				{
					detail: {
						description: "List all organizations",
						tags: ["Platform Admin"],
					},
					response: { 403: ErrorResponse },
				},
				({ user }) => listOrganizationsHandler(user),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/organizations/:id
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/organizations/:id",
				{
					params: t.Object({ id: t.String() }),
					detail: {
						description:
							"Get an organization with its owners and member counts",
						tags: ["Platform Admin"],
					},
					response: { 403: ErrorResponse, 404: ErrorResponse },
				},
				({ params, user }) => getOrganizationHandler(user, params.id),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/stats
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/stats",
				{
					detail: {
						description:
							"System totals: organizations, users, platform admins, pending requests",
						tags: ["Platform Admin"],
					},
					response: { 403: ErrorResponse },
				},
				({ user }) => getPlatformStatsHandler(user),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/pending
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/pending",
				{
					detail: {
						description:
							"Work items that need a platform admin's attention",
						tags: ["Platform Admin"],
					},
					response: {
						200: t.Array(
							t.Object({
								id: t.String(),
								count: t.Number(),
								label: t.String(),
								href: t.String(),
								action: t.String(),
							}),
						),
						403: ErrorResponse,
					},
				},
				({ user }) => getPendingWorkHandler(user),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/activities/modules
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/activities/modules",
				{
					detail: {
						description: "List the platform activity modules",
						tags: ["Platform Admin"],
					},
					response: {
						403: ErrorResponse,
					},
				},
				({ user }) => listPlatformActivityModulesHandler(user),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/platform-admin/activities
			/////////////////////////////////////////////////////
			.get(
				"/platform-admin/activities/",
				{
					query: activityQuerySchema,
					detail: {
						description: "List the platform activity feed",
						tags: ["Platform Admin"],
					},
					response: {
						400: ErrorResponse,
						403: ErrorResponse,
					},
				},
				({ user, query }) => listPlatformActivitiesHandler(user, query),
			),
	);
