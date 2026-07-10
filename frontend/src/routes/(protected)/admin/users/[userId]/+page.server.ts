import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { BetterAuthUser, Role, UserSessionResponseFull } from '$lib';

export const load: PageServerLoad = async ({ params, locals }) => {
	const payload = {
		userId: params.userId
	};
	const [userRes, sessionsRes, rolesRes] = await Promise.allSettled([
		locals.backendFetch(`/api/auth/admin/get-user?id=${params.userId}`),
		locals.backendFetch('/api/auth/admin/list-user-sessions', {
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(payload)
		}),
		locals.backendFetch('/api/v1/users/roles')
	]);

	if (userRes.status === 'rejected') error(503, 'Could not reach the server.');

	const res = userRes.value;

	switch (res.status) {
		case 401:
			error(401, 'Unauthenticated');
			break;
		case 403:
			error(403, 'Unauthorized');
	}

	if (!res.ok) error(res.status, 'Failed to load user');

	const user: BetterAuthUser = await res.json();

	if (sessionsRes.status === 'rejected') {
		console.error('Failed to fetch user sessions:', sessionsRes.reason);
	} else if (!sessionsRes.value.ok) {
		console.error(sessionsRes);

		console.error('Sessions request returned non-ok status:', sessionsRes.value.status);
	}

	const sessionData: UserSessionResponseFull | null =
		sessionsRes.status === 'fulfilled' && sessionsRes.value.ok
			? await sessionsRes.value.json()
			: null;

	if (rolesRes.status === 'rejected') {
		console.error('Failed to fetch roles:', rolesRes.reason);
	} else if (!rolesRes.value.ok) {
		console.error('Roles request returned non-ok status:', rolesRes.value.status);
	}

	const rolesData: Role[] | null =
		rolesRes.status === 'fulfilled' && rolesRes.value.ok ? await rolesRes.value.json() : null;

	return { user, sessionData: sessionData, me: locals.session, rolesData: rolesData };
};
