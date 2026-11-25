import { SCOPES } from "@lib/audit";
import { User } from "@lib/auth";
import { ForbiddenError } from "@lib/errors";
import { assertOrgPermission } from "@lib/security/helpers";

// Platform admins see only the platform-level modules.
export function listPlatformActivityModulesHandler(actor: User) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}
	return { modules: SCOPES.platform };
}

// Org members with permission see only the org-level modules.
export async function listOrgActivityModulesHandler(
	headers: Headers,
	organizationId: string,
) {
	await assertOrgPermission(headers, organizationId, { activity: ["read"] });
	return { modules: SCOPES.organization };
}
