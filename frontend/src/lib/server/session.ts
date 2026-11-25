import { authClient } from '#lib/auth-client.js';
import type { BetterAuthSession } from '#lib/interfaces.ts';
import { errMsg } from '#lib/utils.ts';
import type { BackendFetchType } from './backend-fetch';

type fullSession = typeof authClient.$Infer.Session;

export async function fetchSession(
	backendFetch: BackendFetchType
): Promise<BetterAuthSession | null> {
	try {
		const res = await backendFetch('/api/auth/get-session');
		if (!res.ok) throw new Error(`${res.status}`);

		const data: unknown = await res.json();
		if (!data || typeof data !== 'object' || !('session' in data) || !('user' in data)) {
			return null;
		}

		const fullSessionData = data as fullSession;
		return {
			session: fullSessionData.session,
			user: fullSessionData.user
		};
	} catch (err) {
		console.error('Failed to fetch session:', errMsg(err));
		return null;
	}
}
