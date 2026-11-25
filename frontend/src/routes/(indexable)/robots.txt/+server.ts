import type { RequestHandler } from './$types';
import { PUBLIC_FRONTEND_URL } from '$app/env/public';

export const GET: RequestHandler = async () => {
	const body = [
		'User-agent: *',
		'Allow: /',
		'',
		`Sitemap: ${new URL('/sitemap.xml', PUBLIC_FRONTEND_URL).href}`
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
