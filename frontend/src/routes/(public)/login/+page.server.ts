import { fetchSession } from '#lib/server/session.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const reauth = url.searchParams.get('reauth') === '1';
	const session = await fetchSession(locals.backendFetch);

	if (session && !reauth) {
		redirect(302, `/continue`);
	}

	return { reauth, email: session?.user.email };
};
