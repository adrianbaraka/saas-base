import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { BetterAuthUser } from '$lib';
import { backendFetch } from '$lib/server/backend-fetch';

export interface ListUsersResponse {
	users: BetterAuthUser[];
	total: number;
	limit: number;
	offset: number;
}

export const load: PageServerLoad = async ({ fetch, request, url, locals, getClientAddress }) => {
	const limit = Number(url.searchParams.get('limit') ?? 20);
	const offset = Number(url.searchParams.get('offset') ?? 0);
	const search = url.searchParams.get('search') ?? '';
	const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
	const sortDirection = url.searchParams.get('sortDirection') ?? 'desc';

	const query = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
		sortBy,
		sortDirection,
		...(search && { searchValue: search, searchField: 'email', searchOperator: 'contains' })
	});

	let res: Response;

	try {
		res = await backendFetch(
			`/api/auth/admin/list-users?${query}`,
			request,
			getClientAddress(),
			fetch
		);
	} catch {
		error(503, 'Could not reach the server.');
	}

	switch (res.status) {
		case 401:
			error(401, 'Unauthenticated');
		case 403:
			error(403, 'Unauthorized');
	}

	if (!res.ok) error(res.status, 'Failed to load users');

	const data: ListUsersResponse = await res.json();

	return {
		users: data.users,
		total: data.total,
		limit,
		offset,
		search,
		sortBy,
		sortDirection,
		me: locals.session?.user
	};
};
