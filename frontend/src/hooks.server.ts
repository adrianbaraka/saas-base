import { createBackendFetch } from '#lib/server/backend-fetch.ts';
import { errMsg, fetchJson } from '#lib/utils.ts';
import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { BACKEND_URL } from '$app/env/private';
import { fetchSession } from '#lib/server/session.ts';
import type { OrganizationsResponse } from '#lib/interfaces.ts';
import { canAccessRoute, type UserAccess } from '#lib/roles.ts';

async function proxyToBackend(backendUrl: URL, event: RequestEvent) {
	backendUrl.search = event.url.search;

	const backendRequest = new Request(backendUrl.toString(), event.request.clone());

	backendRequest.headers.set('x-forwarded-for', event.getClientAddress());

	try {
		return await fetch(backendRequest, { redirect: 'manual' });
	} catch (err) {
		console.error(
			`[proxy] Failed to reach backend at ${backendUrl.toString()}: Error: ${errMsg(err)}`
		);
		return new Response(JSON.stringify({ message: 'An Error Occurred. Try Again Later.' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

const noindex: Handle = async ({ event, resolve }) => {
	const route = event.route.id;

	if (route?.startsWith('/(protected)') || route?.startsWith('/(public)')) {
		event.setHeaders({ 'X-Robots-Tag': 'noindex, nofollow' });
	}

	return resolve(event);
};

export const appHandle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;
	event.locals.orgs = null;
	event.locals.backendFetch = createBackendFetch(event);
	// rewrite /api requests to backend. Avoids cors issues entirely
	if (event.url.pathname.startsWith('/api')) {
		return proxyToBackend(new URL(event.url.pathname, BACKEND_URL), event);
	}

	const route = event.route.id;

	// public route skip session check
	if (!route?.startsWith('/(protected)')) {
		return resolve(event);
	}
	// everything from here should be protected

	const session = await fetchSession(event.locals.backendFetch);
	event.locals.session = session;

	// protected route and user is not authenticated redirect to login
	if (!event.locals.session) redirect(302, '/login');

	const orgs = await fetchJson<OrganizationsResponse>(
		event.locals.backendFetch,
		'/api/v1/organizations/me'
	);
	if (!orgs) error(503, 'Could not load your organizations.');
	event.locals.orgs = orgs;

	const access: UserAccess = {
		isPlatformAdmin: session?.user.isPlatformAdmin ?? false,
		organizations: Object.fromEntries(orgs.organizations.map((o) => [o.id, o.roles[0]]))
	};

	if (!canAccessRoute(event.url.pathname, access)) error(403, 'Unauthorized');

	return resolve(event);
};

export const handle = sequence(noindex, appHandle);
