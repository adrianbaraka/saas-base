import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { BetterAuthUser, Role, UserSessionResponseFull } from '$lib';
import { backendFetch } from '$lib/server/backend-fetch';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params,
	locals,
	getClientAddress
}) => {
	const payload = {
		userId: params.userId
	};
	const [userRes, sessionsRes, rolesRes] = await Promise.allSettled([
		backendFetch(
			`/api/auth/admin/get-user?id=${params.userId}`,
			request,
			getClientAddress(),
			fetch
		),
		backendFetch('/api/auth/admin/list-user-sessions', request, getClientAddress(), fetch, {
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(payload)
		}),
		backendFetch('/api/v1/roles', request, getClientAddress(), fetch)
	]);

	if (userRes.status === 'rejected') error(503, 'Could not reach the server.');

	const res = userRes.value;

	switch (res.status) {
		case 401:
			error(401, 'Unauthenticated');
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
