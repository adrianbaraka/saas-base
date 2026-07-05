import { rolePrefix } from '$lib/roles';
import { fetchSession } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, request, getClientAddress }) => {
	const session = await fetchSession(request, getClientAddress(), fetch);

	if (session) {
		const userDashboard = `${rolePrefix(session.user.role)}/dashboard`;
		redirect(302, userDashboard);
	}
};
