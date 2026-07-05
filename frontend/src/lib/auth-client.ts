import { env } from '$env/dynamic/public';
import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

if (!env.PUBLIC_FRONTEND_URL) {
	throw new Error('PUBLIC_FRONTEND_URL is not set');
}

export const authClient = createAuthClient({
	baseURL: `${env.PUBLIC_FRONTEND_URL}/api/auth`,
	plugins: [adminClient()]
});
