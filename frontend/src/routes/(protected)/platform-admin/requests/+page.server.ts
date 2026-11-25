import type { TenantRequest } from '#lib/interfaces.ts';
import { getJson, intParam } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export interface ListReqsResponse {
	requests: TenantRequest[];
	total: number;
	limit: number;
	offset: number;
}

const MAX_LIMIT = 100;

export const load: PageServerLoad = async ({ url, locals }) => {
	const limit = intParam(url.searchParams.get('limit'), 20, 1, MAX_LIMIT);
	const offset = intParam(url.searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER);
	const status = url.searchParams.get('status') ?? '';
	const search = url.searchParams.get('search') ?? '';
	const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
	const sortDirection = url.searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';

	const query = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
		sortBy,
		sortDirection,
		...(status && { status }),
		...(search && { searchValue: search })
	});

	const data = await getJson<ListReqsResponse>(
		locals,
		`/api/v1/platform-admin/org-requests?${query}`,
		'Failed to load requests'
	);

	return {
		reqs: data.requests,
		total: data.total,
		limit,
		offset,
		filters: { status },
		search,
		sortBy,
		sortDirection,
		me: locals.session?.user
	};
};
