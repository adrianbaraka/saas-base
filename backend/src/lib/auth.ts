/* eslint-disable */
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { db } from "./db";
import { env } from "./env";
import { openAPI } from "better-auth/plugins/open-api";
import openapi from "@elysia/openapi";
import * as authSchema from "@lib/db/schema/auth-schema";
import { existingSignUpEmail, resetPasswordEmail } from "./email";
import { organization } from "better-auth/plugins";
import { markEmailVerified } from "./services/users.services";
import { Fullroles, ac } from "./security/permissions";
import { logQuiet } from "./audit";

const AUTH_BASE_PATH = "/api/auth";
const cacheAge = Number(env.CACHE_MINUTES) * 60;
export const trustedOrigins = [
	env.BETTER_AUTH_URL,
	...(process.env.NODE_ENV !== "production" ? ["http://localhost:8000"] : []),
];

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),
	basePath: AUTH_BASE_PATH,
	session: {
		cookieCache: {
			enabled: true,
			maxAge: cacheAge, // Cache duration in seconds
		},
		//freshAge: 10
	},
	trustedOrigins: trustedOrigins,
	advanced: {
		ipAddress: {
			ipAddressHeaders: ["x-forwarded-for"],
		},
	},
	user: {
		additionalFields: {
			isPlatformAdmin: {
				type: "boolean",
				defaultValue: false,
				input: false,
			},
			welcomeEmailSentAt: {
				type: "date",
				required: false,
				input: false,
			},
			phone: {
				type: "string[]",
				required: false,
				input: true,
			},
		},
	},
	disabledPaths: [
		"/callback",
		"/sign-in/social",
		"/sign-up/email",
		"/verify-email",
		"/send-verification-email",
		"/change-email",
		"/delete-user",
		"/link-social",
		"list-accounts",
		"/delete-user/callback",
		"/unlink-account",
		"/account-info",
		"/organization/create",
		"/organization/delete",
		"/organization/invite-member",
		"/organization/update-member-role",
		"/organization/list-members",
		"/organization/cancel-invitation",
		"/organization/accept-invitation",
		"/organization/get-invitation",
		"/organization/reject-invitation",
		"/organization/list-invitations",
		"/organization/remove-member",
		"/organization/list-user-invitations",
	],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		// @ts-ignore
		onExistingUserSignUp: async ({ user }, request) => {
			existingSignUpEmail(user);
		},
		// @ts-ignore
		sendResetPassword: async ({ user, url, token }, request) => {
			resetPasswordEmail(user, url);
		},
		// @ts-ignore
		onPasswordReset: async ({ user }, request) => {
			// set email to verified since they were able to reset the password from email
			markEmailVerified(user.id, user.emailVerified);
		},
	},
	plugins: [
		openAPI(),
		organization({
			ac,
			roles: Fullroles,
			allowUserToCreateOrganization: async (user) =>
				user.isPlatformAdmin === true,
			membershipLimit: 1000000, // TODO limit number?
			disableOrganizationDeletion: true,
			organizationHooks: {
				afterRemoveMember: async ({ member, user, organization }) => {
					// admin removals are logged in removeOrgMemberHandler
					if (member.userId !== user.id) return;

					await logQuiet(db, {
						module: "members",
						action: "member.left",
						description: `${user.name} left the organization (${member.role})`,
						organizationId: organization.id,
						actorId: user.id,
						metadata: {
							entityType: "user",
							ids: [user.id],
							count: 1,
							memberId: member.id,
							role: member.role,
						},
					});
				},
			},
		}),
	],
});

// extract openapi schema
// https://elysiajs.com/integrations/better-auth.html
let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

// List of public auth endpoints that do not require an active session
const publicEndpoints = [
	"/sign-in/email",
	"/sign-up/email",
	"/sign-in/social",
	"/api/auth/ok",
	"/api/auth/error",
];
type OpenAPIDocs = NonNullable<
	NonNullable<Parameters<typeof openapi>[0]>["documentation"]
>;
type Paths = NonNullable<OpenAPIDocs["paths"]>;
type Components = NonNullable<OpenAPIDocs["components"]>;
export const OpenAPI = {
	getPaths: (prefix = AUTH_BASE_PATH) =>
		getSchema().then(({ paths }) => {
			const reference: typeof paths = Object.create(null);
			for (const path of Object.keys(paths)) {
				const key = prefix + path;
				// @ts-ignore
				reference[key] = paths[path];
				// @ts-ignore
				for (const method of Object.keys(paths[path])) {
					const operation = (reference[key] as any)[method];
					operation.tags = ["Better Auth"];

					if (publicEndpoints.some((p) => path.startsWith(p))) {
						operation.security = [];
					}
				}
			}
			return reference;
		}) as unknown as Promise<Paths>,
	components: getSchema().then(
		({ components }) => components,
	) as unknown as Promise<Components>,
} as const;

export type User = typeof auth.$Infer.Session.user;
