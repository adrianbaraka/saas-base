import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import * as authSchema from "@lib/db/schema/auth-schema";
import { db } from "@lib/db";
import Elysia from "elysia";
import openapi from "@elysia/openapi";
import { roles } from "./roles";

const AUTH_BASE_PATH = "/auth/api";

// https://better-auth.com/docs/concepts/database#extending-core-schema
// https://better-auth.com/docs/concepts/typescript#inferring-additional-fields-on-client
// better auth object
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),
	user: {
		additionalFields: {
			roles: {
				type: "string[]",
				required: true,
				input: false,
				defaultValue: [roles.User],
			},
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	basePath: AUTH_BASE_PATH,
	plugins: [openAPI()],
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;

// extract openapi schema
// https://elysiajs.com/integrations/better-auth.html
let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

// List of public auth endpoints that do not require an active session
const publicEndpoints = ["/sign-in/email", "/sign-up/email", "/sign-in/social"];

export const OpenAPI = {
	getPaths: (prefix = AUTH_BASE_PATH) =>
		getSchema().then(({ paths }) => {
			const reference: typeof paths = Object.create(null);
			for (const path of Object.keys(paths)) {
				const key = prefix + path;
				reference[key] = paths[path];

				for (const method of Object.keys(paths[path])) {
					const operation = (reference[key] as any)[method];
					operation.tags = ["Better Auth"];

					if (publicEndpoints.some((p) => path.startsWith(p))) {
						operation.security = [];
					}
				}
			}
			return reference;
		}) as Promise<any>,
	components: getSchema().then(
		({ components }) => components,
	) as Promise<any>,
} as const;

// better auth route handler
export const betterAuthRoute = new Elysia({ name: "better-auth" }).mount(
	auth.handler,
);

// openapi docs for better auth
const betterAuthComponents = await OpenAPI.components;

export const betterAuthDocs = new Elysia({ name: "better-auth-docs" }).use(
	openapi({
		documentation: {
			components: {
				...betterAuthComponents,
				securitySchemes: {
					...betterAuthComponents?.securitySchemes,
					CookieAuth: {
						type: "apiKey",
						in: "cookie",
						name: "better-auth.session_token",
					},
				},
			},
			paths: await OpenAPI.getPaths(),
			security: [{ CookieAuth: [] }], // Reference cookie globally
		},
	}),
);

// checks that user is authenticated
export const authMacro = new Elysia({ name: "auth-macro" }).macro({
	isAuthenticated: (_enabled: boolean) => ({
		async resolve({ status, request: { headers } }) {
			const { auth } = await import("@lib/auth");
			const session = await auth.api.getSession({ headers });
			if (!session) return status(401, { error: "Unauthorized" });

			return {
				user: session.user,
				session: session.session,
			};
		},
	}),
});
