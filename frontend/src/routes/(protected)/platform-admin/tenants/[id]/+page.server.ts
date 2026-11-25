import type { PlatformOrganization } from '#lib/interfaces.ts';
import { getJson } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export interface OrganizationOriginRequest {
	id: string;
	createdAt: string; // ISO 8601
	createdBy: string | null;
	createdByName: string | null;
	reviewedBy: string | null;
	reviewedByName: string | null;
	reviewedAt: string | null; // ISO 8601
}

export interface OrganizationDetail extends PlatformOrganization {
	request: OrganizationOriginRequest | null;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const org = await getJson<OrganizationDetail>(
		locals,
		`/api/v1/platform-admin/organizations/${encodeURIComponent(params.id)}`,
		'Failed to load organization'
	);

	return {
		org,
		me: locals.session?.user
	};
};
