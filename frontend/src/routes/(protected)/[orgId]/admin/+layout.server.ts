import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, params }) => {
	const org = locals.orgs?.organizations.find((o) => o.id === params.orgId);
	if (!org) error(404, 'Organization not found');

	return { org: { name: org.name } };
};
