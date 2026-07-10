import { env } from '$env/dynamic/public';
import type { BetterAuthUser, ErrorResponse } from '$lib';
import { showToast } from './components/Toast/toastStore.svelte';

export async function welcomeEmailSend({ email, me }: { email: string; me: BetterAuthUser }) {
	if (!email || !me) {
		showToast('An error occurred sending welcome email', 'error');
		return;
	}
	const isAdmin = me.role?.includes('admin');
	// TODO who can send a welcome email
	if (!isAdmin) {
		showToast('You cannot perform this action.', 'error');
		return;
	}
	const payload = {
		email: email,
		redirectTo: `${env.PUBLIC_FRONTEND_URL}/welcome`
	};
	try {
		const res = await fetch('/api/v1/users/send-welcome', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const e: ErrorResponse = await res.json();
			showToast(e.error, 'error');
			return;
		}
		showToast(`Email sent to ${email}`, 'success');
	} catch (error) {
		console.error('Error sending email.', error);
		showToast('Error sending email.', 'error');
	}
}

type InviteStatus = 'none' | 'pending' | 'expired';
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in MS

export function getInviteStatus(welcomeEmailSentAt: Date | string | null): InviteStatus {

	if (!welcomeEmailSentAt) return 'none';

	const sentAt =
		welcomeEmailSentAt instanceof Date ? welcomeEmailSentAt : new Date(welcomeEmailSentAt);

	const elapsed = Date.now() - sentAt.getTime();
	return elapsed < INVITE_TTL_MS ? 'pending' : 'expired';
}

export function isEffectivelyBanned(
	banned: boolean | null | undefined,
	banExpires: Date | string | null | undefined
) {
	if (!banned) return false;
	if (!banExpires) return true; // permanent ban
	const banexp = banExpires instanceof Date ? banExpires : new Date(banExpires);

	return banexp.getTime() > Date.now();
}
