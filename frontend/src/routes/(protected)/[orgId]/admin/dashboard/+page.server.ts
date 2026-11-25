import { getPending } from '#lib/pending.ts';
import { getJson } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export interface OrgStats {
	totalUsers: number;
	unverifiedUsers: number;
	adminUsers: number;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const orgPath = `/api/v1/organizations/${encodeURIComponent(params.orgId)}`;

	const stats = await getJson<OrgStats>(locals, `${orgPath}/stats`, 'Failed to load stats');

	return {
		stats,
		me: locals.session?.user,
		pending: getPending(locals, `${orgPath}/pending`)
	};
};
