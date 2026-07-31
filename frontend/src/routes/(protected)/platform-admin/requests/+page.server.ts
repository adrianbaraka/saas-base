import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { req } from '$lib';

export interface ListReqsResponse {
	requests: req[];
	total: number;
	limit: number;
	offset: number;
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const limit = Number(url.searchParams.get('limit') ?? 20);
	const filter = url.searchParams.get('filter') ?? '';
	const offset = Number(url.searchParams.get('offset') ?? 0);
	const search = url.searchParams.get('search') ?? '';
	const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
	const sortDirection = url.searchParams.get('sortDirection') ?? 'desc';

	const query = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
		sortBy,
		sortDirection,
		...(filter && { filter }),
		...(search && { searchValue: search })
	});

	let requestsRes: Response;

	try {
		requestsRes = await locals.backendFetch(`/api/v1/tenants/list-requests?${query}`);
	} catch {
		error(503, 'Could not reach the server.');
	}

	switch (requestsRes.status) {
		case 401:
			error(401, 'Unauthenticated');
			break;
		case 403:
			error(403, 'Unauthorized');
	}
	if (!requestsRes.ok) error(requestsRes.status, 'Failed to load requests');

	const data: ListReqsResponse = await requestsRes.json();

	return {
		reqs: data.requests,
		total: data.total,
		limit,
		offset,
		filter,
		search,
		sortBy,
		sortDirection,
		me: locals.session?.user
	};
};
