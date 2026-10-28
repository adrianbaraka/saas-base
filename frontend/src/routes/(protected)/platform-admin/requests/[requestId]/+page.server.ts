import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { reqRes } from '#lib';

export const load: PageServerLoad = async ({ locals, params }) => {
	const payload = {
		requestId: params.requestId
	};

	let res: Response;
	try {
		res = await locals.backendFetch(`/api/v1/tenants/request/${payload.requestId}`);
	} catch (err) {
		console.error(err);
		error(503, 'Could not reach the server.');
	}

	switch (res.status) {
		case 401:
			error(401, 'Unauthenticated');
			break;
		case 403:
			error(403, 'Unauthorized');
	}
	if (!res.ok) error(res.status, 'Failed to load tenant request.');

	const data: reqRes = await res.json();

	return {
		me: locals.session?.user,
		req: data
	};
};
