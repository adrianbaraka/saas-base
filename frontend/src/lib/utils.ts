import { error } from '@sveltejs/kit';
import type { BackendFetchType } from './server/backend-fetch';

export function errMsg(err: unknown): string {
	if (err instanceof Error) {
		const { code, path } = err as { code?: string; path?: string };
		return [code, err.message, path && `(${path})`].filter(Boolean).join(' ');
	}
	return String(err);
}

/**
 * Fetches optional data for a streamed `load` promise. Never rejects: any
 * network error, non-2xx status or malformed body resolves to `fallback`,
 * so the page can render it without a `{:catch}` block.
 */
export async function getJsonOr<T>(locals: App.Locals, path: string, fallback: T): Promise<T> {
	try {
		const res = await locals.backendFetch(path);
		return res.ok ? ((await res.json()) as T) : fallback;
	} catch {
		return fallback;
	}
}

export async function getJson<T>(
	locals: App.Locals,
	path: string,
	errorMessage: string
): Promise<T> {
	let res: Response;
	try {
		res = await locals.backendFetch(path);
	} catch {
		error(503, 'Could not reach the server.');
	}

	if (res.status === 401) error(401, 'Unauthenticated');
	if (res.status === 403) error(403, 'Unauthorized');
	if (!res.ok) error(res.status, errorMessage);

	return res.json() as Promise<T>;
}

export async function fetchJson<T>(
	backendFetch: BackendFetchType,
	path: string
): Promise<T | null> {
	try {
		const res = await backendFetch(path);
		if (!res.ok) throw new Error(`${res.status}`);
		return (await res.json()) as T;
	} catch (err) {
		console.error(`Failed to fetch ${path}:`, errMsg(err));
		return null;
	}
}

export type ApiResult<T> =
	{ ok: true; data: T } | { ok: false; error: string; status: number | null };

export async function submitJson<T = undefined>(
	path: string,
	body: unknown,
	{
		method = 'POST',
		errorMessage = 'Unable to process request'
	}: { method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; errorMessage?: string } = {}
): Promise<ApiResult<T>> {
	let res: Response;
	try {
		res = await fetch(path, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
	} catch (err) {
		console.error(`Failed to submit to ${path}:`, errMsg(err));
		return { ok: false, error: 'Could not reach the server.', status: null };
	}

	if (!res.ok) {
		const data: { message?: unknown } | null = await res.json().catch(() => null);
		const error = typeof data?.message === 'string' ? data.message : errorMessage;
		return { ok: false, error, status: res.status };
	}

	// 204 or an empty body: data is undefined, which is fine for T = undefined
	const data = (await res.json().catch(() => undefined)) as T;
	return { ok: true, data };
}

export async function postAction<T = undefined>(
	path: string,
	{
		method = 'POST',
		body,
		errorMessage = 'Unable to process request'
	}: { method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; errorMessage?: string } = {}
): Promise<ApiResult<T>> {
	let res: Response;
	try {
		res = await fetch(path, {
			method,
			...(body !== undefined && {
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			})
		});
	} catch (err) {
		console.error(`Failed to submit to ${path}:`, errMsg(err));
		return { ok: false, error: 'Could not reach the server.', status: null };
	}

	if (!res.ok) {
		const data: { message?: unknown } | null = await res.json().catch(() => null);
		const error = typeof data?.message === 'string' ? data.message : errorMessage;
		return { ok: false, error, status: res.status };
	}

	const data = (await res.json().catch(() => undefined)) as T;
	return { ok: true, data };
}

export function safeRedirect(target: string | null, origin: string): string | null {
	if (!target) return null;

	try {
		const url = new URL(target, origin);
		return url.origin === new URL(origin).origin ? url.pathname + url.search + url.hash : null;
	} catch {
		return null;
	}
}

export function pluralSuffix(count: number): string {
	return count === 0 || count > 1 ? 's' : '';
}

export function formatDate(value: string | number | Date | null | undefined) {
	if (!value) return '—';
	return new Date(value).toLocaleDateString('en-KE', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function intParam(raw: string | null, fallback: number, min: number, max: number): number {
	const n = Number.parseInt(raw ?? '', 10);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(Math.max(n, min), max);
}
