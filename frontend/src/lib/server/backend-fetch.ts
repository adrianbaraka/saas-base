import { env } from '$env/dynamic/private';

/**
 * sets the cookies(session) and the client ip
 */
export function backendFetch(
	path: string,
	request: Request,
	clientAddress: string,
	fetchFn: typeof fetch,
	init: RequestInit = {}
): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('cookie', request.headers.get('cookie') ?? '');
	headers.set('x-forwarded-for', clientAddress);

	return fetchFn(`${env.BACKEND_URL}${path}`, { ...init, headers });
}
