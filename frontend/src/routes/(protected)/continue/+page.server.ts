import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { canAccessRoute, getOrganizationDestination, getRolePrefix } from '#lib/roles.ts';
import { safeRedirect } from '#lib/utils.ts';

export type Destination = {
	href: string;
	name: string;
	role: string | null; // null = platform admin card
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session, orgs } = locals;

	// The hook guarantees both on protected routes; this narrows the types
	if (!session || !orgs) redirect(302, '/login');

	// 1. Honor redirectTo if it is safe, allowed, and not this page
	const redirectTo = safeRedirect(url.searchParams.get('redirectTo'), url.origin);
	if (redirectTo) {
		const target = new URL(redirectTo, url.origin).pathname;
		const access = {
			isPlatformAdmin: session.user.isPlatformAdmin,
			organizations: Object.fromEntries(
				orgs.organizations.flatMap((o) => (o.roles[0] ? [[o.id, o.roles[0]] as const] : []))
			)
		};
		if (target !== url.pathname && canAccessRoute(target, access)) {
			redirect(302, redirectTo);
		}
	}

	// 2. Build the destination list
	const destinations: Destination[] = [];

	if (session.user.isPlatformAdmin) {
		destinations.push({ href: '/platform-admin/dashboard', name: 'Platform admin', role: null });
	}

	for (const org of orgs.organizations) {
		const role = org.roles[0];
		if (!role || !getRolePrefix(role)) continue; // skip unusable roles
		destinations.push({
			href: getOrganizationDestination(org.id, role),
			name: org.name,
			role
		});
	}

	// 3. Exactly one destination: go straight there
	if (destinations.length === 1) redirect(302, destinations[0].href);

	// 0 -> page shows "you don't belong to any organization"; 2+ -> picker
	return { destinations };
};
