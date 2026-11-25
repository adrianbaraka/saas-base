import type { PlatformOrganization } from '#lib/interfaces.ts';
import { getJson } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export interface ListOrganizationsResponse {
	organizations: PlatformOrganization[];
}

export const load: PageServerLoad = async ({ locals }) => {
	const data = await getJson<ListOrganizationsResponse>(
		locals,
		'/api/v1/platform-admin/organizations',
		'Failed to load organizations'
	);

	return {
		orgs: data.organizations,
		me: locals.session?.user
	};
};
