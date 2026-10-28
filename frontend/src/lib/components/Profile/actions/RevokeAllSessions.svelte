<script lang="ts">
	import LogoutIcon from '@iconify-svelte/material-symbols/logout';
	import { refreshAll } from '$app/navigation';
	import type { AuthError, BetterAuthUser } from '#lib';
	import { authClient } from '#lib/auth-client.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';

	let { me, user, isProfile }: { me: BetterAuthUser; user: BetterAuthUser; isProfile: boolean } =
		$props();
	const myOwnPage = $derived(me.id === user.id ? true : false);
	const isAdmin = $derived(me.role?.includes('admin'));
	const possessive = $derived(isProfile ? 'my' : 'user');

	async function revokeAllSessions() {
		if (myOwnPage) {
			//confirm deletion of all sessions including current
			const confirmed = await openModal({
				title: 'Revoke all sessions',
				content: ConfirmSession
			});
			if (!confirmed) {
				return;
			}
		}
		let e: AuthError | null = null;
		if (!isProfile && isAdmin) {
			// alert if own session will log them out
			const { error } = await authClient.admin.revokeUserSessions({
				userId: user.id
			});
			e = error;
		} else {
			const { error } = await authClient.revokeSessions();
			e = error;
		}

		if (e) {
			console.error(e);
			showToast(e.message ?? 'An error occurred revoking all sessions', 'error');
		} else {
			showToast('Successfully revoked all sessions', 'success');
			await refreshAll();
		}
	}
</script>

{#snippet ConfirmSession({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<div>
		<p class="py-4">
			This includes your current session. Revoking it will sign you out immediately.
		</p>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-error" onclick={confirm}>Confirm</button>
		</div>
	</div>
{/snippet}

<button class="btn text-error rounded-2xl flex flex-row gap-4" onclick={revokeAllSessions}>
	<span>Revoke all {possessive} sessions</span>
	<LogoutIcon height="24" />
</button>
