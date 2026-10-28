import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { UserSessionFull } from '#lib';

export const load: PageServerLoad = async ({ locals }) => {
	let res: Response;
	try {
		res = await locals.backendFetch('/api/auth/list-sessions');
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
