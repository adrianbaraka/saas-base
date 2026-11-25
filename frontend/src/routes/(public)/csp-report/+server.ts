// Receives CSP violation reports from browsers (report-uri).

import type { RequestHandler } from '@sveltejs/kit';

// Browsers send these as application/csp-report (or application/reports+json).
export const POST: RequestHandler = async ({ request }) => {
	try {
		const text = await request.text();

		// cap what we log so a noisy or malicious client can't flood the logs
		console.warn('[csp-report]', text.slice(0, 2000));
	} catch {
		// never fail loudly on a report
	}

	return new Response(null, { status: 204 });
};
