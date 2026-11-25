import type { RequestHandler } from './$types';
import { PUBLIC_FRONTEND_URL } from '$app/env/public';

type SitemapEntry = {
	route: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number;
};

const defaults = {
	changefreq: 'weekly',
	priority: 0.5
} as const;

const routes: SitemapEntry[] = [
	// { route: '/', priority: 1.0, changefreq: 'daily' },
	// { route: '/about' },
	// { route: '/pricing', priority: 0.8 },
	// { route: '/contact', changefreq: 'monthly', priority: 0.6 }
];

const escapeXml = (value: string) =>
	value.replace(/[<>&'"]/g, (char) => {
		const entities: Record<string, string> = {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;',
			"'": '&apos;',
			'"': '&quot;'
		};
		return entities[char];
	});

function generateUrls(entries: SitemapEntry[]) {
	return entries
		.map(({ route, lastmod, ...overrides }) => {
			const config = { ...defaults, ...overrides };

			return `
				<url>
					<loc>${escapeXml(new URL(route, PUBLIC_FRONTEND_URL).href)}</loc>
					${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}
					<changefreq>${config.changefreq}</changefreq>
					<priority>${config.priority}</priority>
				</url>
			`;
		})
		.join('');
}

export const GET: RequestHandler = async () => {
	const xml = `
		<?xml version="1.0" encoding="UTF-8"?>
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
			${generateUrls(routes)}
		</urlset>
	`.trim();

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
