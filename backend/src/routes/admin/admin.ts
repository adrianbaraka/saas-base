import Elysia, { t } from "elysia";
import { authMacro } from "@lib/security/helpers";
import { ErrorResponse } from "@lib/errors";
import { orgRoleSchema } from "@lib/security/permissions";
import {
	addOrgMemberHandler,
	getOrgMemberHandler,
	getOrgPendingWorkHandler,
	getOrgRolesHandler,
	getOrgStatsHandler,
	listOrgMembersHandler,
	removeOrgMemberHandler,
	resendOrgMemberWelcomeHandler,
	setOrgMemberRoleHandler,
	updateOrgMemberHandler,
} from "./admin.handlers";
import { listOrgActivityModulesHandler } from "@lib/services/activity.service";
import { activityQuerySchema, listOrgActivitiesHandler } from "@routes/activity/activity.handlers"

export const orgMemberRoutes = new Elysia({ prefix: "/organizations" })
	.use(authMacro)
	.guard({ auth: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// POST /api/v1/organizations/:organizationId/members
			/////////////////////////////////////////////////////
			.post(
				":organizationId/members",
				{
					params: t.Object({ organizationId: t.String() }),
					body: t.Object({
						phone: t.String({ minLength: 1, maxLength: 20 }),
						email: t.String({ format: "email", maxLength: 254 }),
						name: t.String({ minLength: 2, maxLength: 100 }),
						role: orgRoleSchema, // owner can't be granted here
					}),
					detail: {
						description: "Add a member to an organization",
						tags: ["Organizations"],
					},
					response: {
						400: ErrorResponse,
						403: ErrorResponse,
						404: ErrorResponse,
						409: ErrorResponse,
					},
				},
				({ params, body, user, request }) =>
					addOrgMemberHandler(
						user,
						request.headers,
						params.organizationId,
						body,
					),
			)
			/////////////////////////////////////////////////////
			// POST /api/v1/organizations/:organizationId/members/resend-welcome
			/////////////////////////////////////////////////////
			.post(
				":organizationId/members/resend-welcome",
				{
					params: t.Object({ organizationId: t.String() }),
					body: t.Object({
						email: t.String({ format: "email", maxLength: 254 }),
					}),
					detail: {
						description:
							"Resend the set-password email to a member who hasn't finished setup",
						tags: ["Organizations"],
					},
					response: {
						400: ErrorResponse,
						403: ErrorResponse,
						404: ErrorResponse,
						409: ErrorResponse,
					},
				},
				({ params, body, user, request }) =>
					resendOrgMemberWelcomeHandler(
						user,
						request.headers,
						params.organizationId,
						body,
					),
			)

			/////////////////////////////////////////////////////
			// PATCH /api/v1/organizations/:organizationId/members/:memberId/role
			/////////////////////////////////////////////////////
			.patch(
				":organizationId/members/:memberId/role",
				{
					params: t.Object({
						organizationId: t.String(),
						memberId: t.String(),
					}),
					body: t.Object({
						role: orgRoleSchema, // org roles only; owner can't be set here
					}),
					detail: {
						description: "Change a member's role (org roles only)",
						tags: ["Organizations"],
					},
					response: {
						400: ErrorResponse,
						403: ErrorResponse,
						404: ErrorResponse,
					},
				},
				({ params, body, request, user }) =>
					setOrgMemberRoleHandler(
						user,
						request.headers,
						params.organizationId,
						params.memberId,
						body.role,
					),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/organizations/:organizationId/members
			/////////////////////////////////////////////////////
			.get(
				":organizationId/members",
				{
					params: t.Object({ organizationId: t.String() }),
					query: t.Object({
						searchValue: t.Optional(t.String({ maxLength: 100 })), // name or email
						emailVerified: t.Optional(t.BooleanString()),
						role: t.Optional(t.String()), // matches one role within a comma-separated list
						limit: t.Optional(
							t.Numeric({ minimum: 1, maximum: 100 }),
						),
						offset: t.Optional(t.Numeric({ minimum: 0 })),
						sortBy: t.Optional(
							t.Union([
								t.Literal("createdAt"),
								t.Literal("name"),
								t.Literal("email"),
							]),
						),
						sortDirection: t.Optional(
							t.Union([t.Literal("asc"), t.Literal("desc")]),
						),
					}),
					detail: {
						description: "List members of an organization",
						tags: ["Organizations"],
					},
					response: {
						403: ErrorResponse,
					},
				},
				({ params, query, request }) =>
					listOrgMembersHandler(
						request.headers,
						params.organizationId,
						query,
					),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/organizations/:organizationId/members/:memberId
			/////////////////////////////////////////////////////
			.get(
				":organizationId/members/:memberId",
				{
					params: t.Object({
						organizationId: t.String(),
						memberId: t.String(),
					}),
					detail: {
						description: "Get a single member's details",
						tags: ["Organizations"],
					},
					response: {
						403: ErrorResponse,
						404: ErrorResponse,
					},
				},
				({ params, request }) =>
					getOrgMemberHandler(
						request.headers,
						params.organizationId,
						params.memberId,
					),
			)

			/////////////////////////////////////////////////////
			// PATCH /api/v1/organizations/:organizationId/members/:memberId
			/////////////////////////////////////////////////////
			.patch(
				":organizationId/members/:memberId",
				{
					params: t.Object({
						organizationId: t.String(),
						memberId: t.String(),
					}),
					body: t.Object(
						{
							name: t.Optional(
								t.String({
									minLength: 1,
									maxLength: 100,
									pattern: "\\S",
								}), // not whitespace-only
							),
							phone: t.Optional(
								t.Array(
									t.String({ minLength: 3, maxLength: 20 }),
									{ maxItems: 5 },
								),
							),
						},
						{ minProperties: 1 }, // reject an empty body
					),
					detail: {
						description:
							"Update a member's profile details (name, phone)",
						tags: ["Organizations"],
					},
					response: {
						403: ErrorResponse,
						404: ErrorResponse,
					},
				},
				({ params, body, request }) =>
					updateOrgMemberHandler(
						request.headers,
						params.organizationId,
						params.memberId,
						body,
					),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/organizations/:organizationId/stats
			/////////////////////////////////////////////////////
			.get(
				":organizationId/stats",
				{
					params: t.Object({ organizationId: t.String() }),
					detail: {
						description:
							"Get member statistics for an organization",
						tags: ["Organizations"],
					},
					response: {
						403: ErrorResponse,
					},
				},
				({ params, request }) =>
					getOrgStatsHandler(request.headers, params.organizationId),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/organizations/:organizationId/roles
			/////////////////////////////////////////////////////
			.get(
				":organizationId/roles",
				{
					params: t.Object({ organizationId: t.String() }),
					query: t.Object({
						assignable: t.Optional(t.BooleanString()), // only roles that can be granted
					}),
					detail: {
						description:
							"List the roles available in an organization. With assignable=true, only roles that can be granted to a member (excludes owner).",
						tags: ["Organizations"],
					},
					response: {
						403: ErrorResponse,
					},
				},
				({ params, query, request }) =>
					getOrgRolesHandler(
						request.headers,
						params.organizationId,
						query.assignable,
					),
			)

			/////////////////////////////////////////////////////
			// DELETE /api/v1/organizations/:organizationId/members/:memberId
			/////////////////////////////////////////////////////
			.delete(
				":organizationId/members/:memberId",
				{
					params: t.Object({
						organizationId: t.String(),
						memberId: t.String(),
					}),
					detail: {
						description:
							"Remove a member from the organization (the user account is kept)",
						tags: ["Organizations"],
					},
					response: {
						400: ErrorResponse,
						403: ErrorResponse,
						404: ErrorResponse,
					},
				},
				// get `actor` the same way your add-member route does
				({ params, request, user }) =>
					removeOrgMemberHandler(
						user,
						request.headers,
						params.organizationId,
						params.memberId,
					),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/organizations/:organizationId/pending
			/////////////////////////////////////////////////////
			.get(
				":organizationId/pending",
				{
					params: t.Object({ organizationId: t.String() }),
					detail: {
						description:
							"Work items that need an organization admin's attention",
						tags: ["Organizations"],
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
				({ params, request }) =>
					getOrgPendingWorkHandler(
						request.headers,
						params.organizationId,
					),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/organizations/:organizationId/activities/modules
			/////////////////////////////////////////////////////
			.get(
				":organizationId/activities/modules",
				{
					params: t.Object({ organizationId: t.String() }),
					detail: {
						description:
							"List the activity modules available to filter by",
						tags: ["Organizations"],
					},
					response: {
						403: ErrorResponse,
					},
				},
				({ params, request }) =>
					listOrgActivityModulesHandler(
						request.headers,
						params.organizationId,
					),
			)

			/////////////////////////////////////////////////////
			// GET /api/v1/organizations/:organizationId/activities
			/////////////////////////////////////////////////////
			.get(
				":organizationId/activities",
				{
					params: t.Object({ organizationId: t.String() }),
					query: activityQuerySchema,
					detail: {
						description: "List an organization's activity feed",
						tags: ["Organizations"],
					},
					response: {
						400: ErrorResponse,
						403: ErrorResponse,
					},
				},
				({ params, query, request }) =>
					listOrgActivitiesHandler(
						request.headers,
						params.organizationId,
						query,
					),
			),
	);
