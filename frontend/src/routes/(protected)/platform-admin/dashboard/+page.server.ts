import { getPending } from '#lib/pending.ts';
import { getJson } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export interface PlatformStats {
	totalOrganizations: number;
	totalUsers: number;
	totalPlatformAdmins: number;
	pendingRequests: number;
	limboAccounts: number;
}

export const load: PageServerLoad = async ({ locals }) => {
	const stats = await getJson<PlatformStats>(
		locals,
		'/api/v1/platform-admin/stats',
		'Failed to load platform stats'
	);

	return {
		stats,
		me: locals.session?.user,
		pending: getPending(locals, '/api/v1/platform-admin/pending')
	};
};
