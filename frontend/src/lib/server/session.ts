import type { BetterAuthSession } from '$lib';
import { authClient } from '$lib/auth-client';
import { backendFetch } from './backend-fetch';

type fullSession = typeof authClient.$Infer.Session;

export async function fetchSession(
	request: Request,
	clientAddress: string,
	fetchFn: typeof fetch
): Promise<BetterAuthSession | null> {
	try {
		const res = await backendFetch('/api/auth/get-session', request, clientAddress, fetchFn);
		if (!res.ok) throw new Error(`${res.status}`);

		const data: fullSession = await res.json();
		if (!data) return null;


		return {
			session: data.session,
			user: data.user
		};
	} catch (err) {
		console.error('Failed to fetch session:', err);
		return null;
	}
}
