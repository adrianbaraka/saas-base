import Elysia from "elysia";
import { authMacro } from "@lib/security/helpers";
import { listMyOrganizationsHandler } from "./member.handlers";

export const MemberRoutes = new Elysia({ prefix: "/organizations" })
	.use(authMacro)
	.guard({ auth: true }, (app) =>
		app
			/////////////////////////////////////////////////////
			// GET /api/v1/organizations/me
			/////////////////////////////////////////////////////
			.get(
				"me",
				{
					detail: {
						description:
							"List the signed-in user's organizations and their roles",
						tags: ["Organizations"],
					},
				},
				({ user }) => listMyOrganizationsHandler(user),
			),
	);
