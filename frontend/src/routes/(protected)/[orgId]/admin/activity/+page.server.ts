import { loadActivityFeed } from '#lib/server/load-activity-feed.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url, locals, params }) =>
	loadActivityFeed(
		url,
		locals,
		`/api/v1/organizations/${encodeURIComponent(params.orgId)}/activities`
	);
