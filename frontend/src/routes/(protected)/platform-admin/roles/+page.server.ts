import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type RolesFullResponse = {
	modules: {
		module: string;
		actions: string[];
	}[];
	roles: {
		role: string;
		permissions: Record<string, string[]>;
	}[];
};

export const load: PageServerLoad = async ({ locals }) => {
	let res: Response;
	try {
		res = await locals.backendFetch('/api/v1/users/roles/full');
	} catch (e) {
		console.error(e);
		error(503, 'An Unexpected error occurred.');
	}

	switch (res.status) {
		case 401:
			error(401, 'Unauthenticated');
			break;
		case 403:
			error(403, 'Unauthorized');
	}

	if (!res.ok) {
		console.error(res.status);
		error(res.status, 'Failed to load roles');
	}

	let rolesFull: RolesFullResponse;
	try {
		rolesFull = await res.json();
	} catch (e) {
		console.error(e);
		error(503, 'An Unexpected error occurred.');
	}

	return {
		me: locals.session?.user,
		rolesFull
	};
};
