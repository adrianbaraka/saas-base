import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { UserSessionFull } from '$lib';
import { backendFetch } from '$lib/server/backend-fetch';

export const load: PageServerLoad = async ({ fetch, request, locals, getClientAddress }) => {
	let res: Response;
	try {
		res = await backendFetch('/api/auth/list-sessions', request, getClientAddress(), fetch);
	} catch (e) {
		console.error(e);
		error(503, 'An Unexpected error occurred.');
	}

	switch (res.status) {
		case 401:
			error(401, 'Unauthenticated');
		case 403:
			error(403, 'Unauthorized');
	}

	if (!res.ok) {
		console.error(res.status);
		error(res.status, 'Failed to load user info');
	}

	let userSessions: UserSessionFull[];
	try {
		userSessions = await res.json();
	} catch (e) {
		console.error(e);
		error(503, 'An Unexpected error occurred.');
	}

	return {
		mySession: locals.session,
		allMySessions: userSessions
	};
};
