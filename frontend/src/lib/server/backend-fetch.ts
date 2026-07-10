import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Creates a per-request backendFetch bound to this request's cookies,
 * client IP, and fetch implementation. Constructed once per request in
 * hooks.server.ts and attached to event.locals.
 */
export function createBackendFetch(event: RequestEvent) {
	const cookie = event.request.headers.get('cookie') ?? '';
	const clientAddress = event.getClientAddress();
	const fetchFn = event.fetch;

	return function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
		const headers = new Headers(init.headers);
		headers.set('cookie', cookie);
		headers.set('x-forwarded-for', clientAddress);

		return fetchFn(`${env.BACKEND_URL}${path}`, { ...init, headers });
	};
}
export type BackendFetchType = ReturnType<typeof createBackendFetch>;
