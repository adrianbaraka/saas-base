import { loadActivityFeed } from '#lib/server/load-activity-feed.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url, locals }) =>
	loadActivityFeed(url, locals, '/api/v1/platform-admin/activities');
