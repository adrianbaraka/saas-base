import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

interface tenant {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface ListTenantsResponse {
	tenants: tenant[];
	total: number;
	limit: number;
	offset: number;
}

export interface TenantsStatsResponse {
	totalUsers: string;
	totalTenants: string;
	newTenantsLast30Days: string;
	pendingRequests: string;
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
		...(search && { searchValue: search })
	});

	let tenantsRes: Response;
	let statsRes: Response;

	try {
		[tenantsRes, statsRes] = await Promise.all([
			locals.backendFetch(`/api/v1/tenants?${query}`),
			locals.backendFetch('/api/v1/tenants/stats')
		]);
	} catch {
		error(503, 'Could not reach the server.');
	}

	for (const res of [tenantsRes, statsRes]) {
		switch (res.status) {
			case 401:
				error(401, 'Unauthenticated');
				break;
			case 403:
				error(403, 'Unauthorized');
		}
		if (!res.ok) error(res.status, 'Failed to load users');
	}

	const [data, stats]: [ListTenantsResponse, TenantsStatsResponse] = await Promise.all([
		tenantsRes.json(),
		statsRes.json()
	]);

	return {
		tenants: data.tenants,
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
