import type { PlatformUser } from '#lib/interfaces.ts';
import { getJson, intParam } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export interface ListUsersResponse {
	users: PlatformUser[];
	total: number;
	limit: number;
	offset: number;
}

const MAX_LIMIT = 100;

export const load: PageServerLoad = async ({ url, locals }) => {
	const limit = intParam(url.searchParams.get('limit'), 20, 1, MAX_LIMIT);
	const offset = intParam(url.searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER);
	const search = url.searchParams.get('search') ?? '';
	const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
	const sortDirection = url.searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';

	// only "true" or "false" are forwarded, anything else means "no filter"
	const rawVerified = url.searchParams.get('emailVerified');
	const emailVerified = rawVerified === 'true' || rawVerified === 'false' ? rawVerified : '';

	const query = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
		sortBy,
		sortDirection,
		...(emailVerified && { emailVerified }),
		...(search && { searchValue: search })
	});

	const data = await getJson<ListUsersResponse>(
		locals,
		`/api/v1/platform-admin/users?${query}`,
		'Failed to load users'
	);

	return {
		users: data.users,
		total: data.total,
		limit,
		offset,
		filters: { emailVerified },
		search,
		sortBy,
		sortDirection,
		me: locals.session?.user
	};
};
