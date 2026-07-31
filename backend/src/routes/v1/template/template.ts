import Elysia, { t } from "elysia";
import { ErrorResponse } from "@lib/interfaces";
import {
	handleNoInput,
	handleWithParams,
	handleWithQuery,
	handleWithBody,
	WithParamsSchema,
	WithQuerySchema,
	WithBodySchema,
} from "./template.handlers";
import { authMacro, prettyPrintPermission } from "@lib/permissions/helpers"


/////////////////////////////////////////////////////
// Routes
/////////////////////////////////////////////////////

export const template = new Elysia({
	prefix: "/template",
	detail: {
		security: [{ sessionAuth: [] }],
		description:
			"A template showcasing usage with non-authenticated, authenticated and protected routes.",
	},
})
	.use(authMacro)

	/////////////////////////////////////////////////////
	// GET /template - no input, no auth
	/////////////////////////////////////////////////////
	.get(
		"",
		async () => {
			return await handleNoInput();
		},
		{
			detail: {
				tags: ["Template"],
				description: "Public endpoint with no input.",
				security: [],
			},
			response: {
				200: t.Object({ message: t.String() }),
			},
		},
	)

	.guard({ isAuthenticated: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// GET /template/:id - params only
			/////////////////////////////////////////////////////
			.get(
				"/:id",
				async ({ params: { id }, user }) => {
					return await handleWithParams(id, user);
				},
				{
					params: WithParamsSchema,
					detail: {
						tags: ["Template"],
						description:
							"Authenticated endpoint with a path param." +
							prettyPrintPermission({ user: ["list"] }),
					},
					response: {
						200: t.Object({ id: t.String() }),
						403: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// GET /template/search - query only
			/////////////////////////////////////////////////////
			.get(
				"/search",
				async ({ query: { q, limit }, user }) => {
					return await handleWithQuery(q, limit, user);
				},
				{
					query: WithQuerySchema,
					detail: {
						tags: ["Template"],
						description:
							"Authenticated endpoint with query params.",
					},
					response: {
						200: t.Array(t.Object({ id: t.String() })),
						401: ErrorResponse,
						403: ErrorResponse,
					},
				},
			)

			/////////////////////////////////////////////////////
			// POST /template - body only
			/////////////////////////////////////////////////////
			.post(
				"",
				async ({ body: { name, description }, user }) => {
					return await handleWithBody(name, description, user);
				},
				{
					body: WithBodySchema,
					detail: {
						tags: ["Template"],
						description:
							"Authenticated endpoint with a request body.",
					},
					response: {
						200: t.Object({ id: t.String(), name: t.String() }),
						400: ErrorResponse,
						403: ErrorResponse,
					},
				},
			),
	);
