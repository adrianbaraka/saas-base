import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { UserSessionFull } from '#lib/interfaces.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
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
			redirect(302, `/login?reauth=1&redirectTo=${encodeURIComponent(url.pathname)}`);
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
