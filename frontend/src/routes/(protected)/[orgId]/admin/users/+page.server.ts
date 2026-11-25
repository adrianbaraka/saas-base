import type { OrgMember, OrgRole } from '#lib/interfaces.ts';
import { getJson, intParam } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export interface ListMembersResponse {
	members: OrgMember[];
	total: number;
	limit: number;
	offset: number;
}

const MAX_LIMIT = 100;
// must match the backend union, anything else would be a 422
const SORT_FIELDS = ['createdAt', 'name', 'email'] as const;

export const load: PageServerLoad = async ({ url, locals, params }) => {
	const limit = intParam(url.searchParams.get('limit'), 20, 1, MAX_LIMIT);
	const offset = intParam(url.searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER);
	const search = url.searchParams.get('search')?.trim().slice(0, 100) ?? '';

	const rawSort = url.searchParams.get('sortBy');
	const sortBy = SORT_FIELDS.find((f) => f === rawSort) ?? 'createdAt';
	const sortDirection = url.searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';

	// only "true" or "false" are forwarded, anything else means "no filter"
	const rawVerified = url.searchParams.get('emailVerified');
	const emailVerified = rawVerified === 'true' || rawVerified === 'false' ? rawVerified : '';

	const role = url.searchParams.get('role')?.trim() ?? '';

	const query = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
		sortBy,
		sortDirection,
		...(emailVerified && { emailVerified }),
		...(role && { role }),
		...(search && { searchValue: search })
	});

	const orgPath = `/api/v1/organizations/${encodeURIComponent(params.orgId)}`;

	const [data, roles] = await Promise.all([
		getJson<ListMembersResponse>(locals, `${orgPath}/members?${query}`, 'Failed to load members'),
		getJson<OrgRole[]>(locals, `${orgPath}/roles`, 'Failed to load roles')
	]);
	return {
		members: data.members,
		roles,
		total: data.total,
		limit,
		offset,
		filters: { emailVerified, role },
		search,
		sortBy,
		sortDirection,
		me: locals.session?.user
	};
};
