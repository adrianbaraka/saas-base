import { rolePrefix } from '#lib/roles.js';
import { fetchSession } from '#lib/server/session.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await fetchSession(locals.backendFetch);

	if (session) {
		const userDashboard = `${rolePrefix(session.user.role)}/dashboard`;
		redirect(302, userDashboard);
	}
};
