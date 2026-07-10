import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { BetterAuthUser } from '$lib';

export interface ListUsersResponse {
	users: BetterAuthUser[];
	total: number;
	limit: number;
	offset: number;
}

export interface UserStatsResponse {
	totalUsers: number;
	bannedUsers: number;
	unverifiedUsers: number;
	adminUsers: number;
}

export const load: PageServerLoad = async ({ url, locals }) => {
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

	let usersRes: Response;
	let statsRes: Response;

	try {
		[usersRes, statsRes] = await Promise.all([
			locals.backendFetch(`/api/auth/admin/list-users?${query}`),
			locals.backendFetch('/api/v1/users/stats')
		]);
	} catch {
		error(503, 'Could not reach the server.');
	}

	for (const res of [usersRes, statsRes]) {
		switch (res.status) {
			case 401:
				error(401, 'Unauthenticated');
			case 403:
				error(403, 'Unauthorized');
		}
		if (!res.ok) error(res.status, 'Failed to load users');
	}

	const [data, stats]: [ListUsersResponse, UserStatsResponse] = await Promise.all([
		usersRes.json(),
		statsRes.json()
	]);

	return {
		users: data.users,
		total: data.total,
		limit,
		offset,
		search,
		sortBy,
		sortDirection,
		me: locals.session?.user,
		stats
	};
};
