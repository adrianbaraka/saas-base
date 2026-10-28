import { type RequestEvent, error, redirect } from '@sveltejs/kit';
import { getRequiredRole } from '#lib/roles.js';
import { fetchSession } from '#lib/server/session.js';
import { BACKEND_URL } from '$app/env/private';
import { createBackendFetch } from '#lib/server/backend-fetch.js';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { errMsg } from '#lib/utils.ts';

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
	if (event.route.id?.startsWith('/(protected)')) {
		event.setHeaders({ 'X-Robots-Tag': 'noindex, nofollow' });
	}
	return resolve(event);
};

export const appHandle: Handle = async ({ event, resolve }) => {
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

	event.locals.session = await fetchSession(event.locals.backendFetch);

	// protected route and user is not authenticated redirect to login
	if (!event.locals.session) redirect(302, '/login');

	// role level protections just ui the backend also enforces
	const requiredRole = getRequiredRole(route);

	// was null or undefined
	if (!requiredRole) {
		return resolve(event);
	}

	if (
		event.locals.session?.user.role === requiredRole ||
		event.locals.session?.user.role === 'admin'
	) {
		return resolve(event);
	} else {
		error(403, 'You are not authorized to view this content.');
	}
};

export const handle = sequence(noindex, appHandle);
