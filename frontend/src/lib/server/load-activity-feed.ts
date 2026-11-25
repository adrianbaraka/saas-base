import type { BetterAuthUser } from '#lib/interfaces.ts';
import { getJson, intParam } from '#lib/utils.ts';

export interface ActivityItem {
	id: string;
	createdAt: string; // ISO string: dates arrive as strings over JSON
	organizationId: string | null;
	actorId: string | null;
	module: string;
	action: string;
	description: string;
	level: 'low' | 'normal' | 'high';
	metadata: {
		entityType?: string;
		ids?: string[];
		count?: number;
		[key: string]: unknown;
	} | null;
}

export interface ListActivitiesResponse {
	items: ActivityItem[];
	nextCursor: string | null;
}

export interface ActivityModulesResponse {
	modules: string[];
}

export interface ActivityFeedPageData {
	items: ActivityItem[];
	nextCursor: string | null;
	modules: string[];
	limit: number;
	cursor: string;
	module: string;
	includeLow: boolean;
	me: BetterAuthUser | undefined;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function loadActivityFeed(
	url: URL,
	locals: App.Locals,
	basePath: string
): Promise<ActivityFeedPageData> {
	const params = url.searchParams;

	const limit = intParam(params.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
	// length caps match the backend query schema, anything longer would be a 422
	const cursor = params.get('cursor')?.slice(0, 200) ?? '';
	const moduleKey = params.get('module')?.trim().slice(0, 50) ?? '';
	// only "true" is forwarded, anything else means "hide low-priority rows"
	const includeLow = params.get('includeLow') === 'true';

	const query = new URLSearchParams({
		limit: String(limit),
		...(cursor && { cursor }),
		...(moduleKey && { module: moduleKey }),
		...(includeLow && { includeLow: 'true' })
	});

	const [feed, modulesBody] = await Promise.all([
		getJson<ListActivitiesResponse>(locals, `${basePath}?${query}`, 'Failed to load activity'),
		getJson<ActivityModulesResponse>(locals, `${basePath}/modules`, 'Failed to load activity')
	]);

	return {
		items: feed.items,
		nextCursor: feed.nextCursor,
		modules: modulesBody.modules,
		limit,
		cursor,
		module: moduleKey,
		includeLow,
		me: locals.session?.user
	};
}
