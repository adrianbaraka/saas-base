import type { OrgRole } from '#lib/interfaces.ts';
import { getJson } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const roles = await getJson<OrgRole[]>(
		locals,
		`/api/v1/organizations/${encodeURIComponent(params.orgId)}/roles?assignable=true`,
		'Failed to load roles'
	);

	return {
		roles,
		me: locals.session?.user
	};
};
