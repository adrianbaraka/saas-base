import { PUBLIC_FRONTEND_URL } from '$app/env/public';
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

if (!PUBLIC_FRONTEND_URL) {
	throw new Error('PUBLIC_FRONTEND_URL is not set');
}

// https://better-auth.com/docs/concepts/typescript#inferring-additional-fields-on-client
export const authClient = createAuthClient({
	baseURL: `${PUBLIC_FRONTEND_URL}/api/auth`,
	plugins: [
		adminClient(),
		inferAdditionalFields({
			user: {
				welcomeEmailSentAt: {
					type: 'date',
					required: false,
					input: false
				},
				tenantId: {
					type: 'string',
					required: false,
					input: false
				}
			}
		})
	]
});
