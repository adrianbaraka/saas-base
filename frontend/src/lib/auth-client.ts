import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
import { PUBLIC_FRONTEND_URL } from '$app/env/public';

// https://better-auth.com/docs/concepts/typescript#inferring-additional-fields-on-client
export const authClient = createAuthClient({
	baseURL: `${PUBLIC_FRONTEND_URL}/api/auth`,
	plugins: [
		organizationClient(),
		inferAdditionalFields({
			user: {
				isPlatformAdmin: {
					type: 'boolean',
					defaultValue: false,
					input: false
				},
				welcomeEmailSentAt: {
					type: 'date',
					required: false,
					input: false
				},
				phone: {
					type: 'string[]',
					required: false,
					input: true
				}
			}
		})
	]
});
