<script lang="ts">
	import LogoutIcon from '@iconify-svelte/material-symbols/logout';
	import { refreshAll } from '$app/navigation';
	import { authClient } from '#lib/auth-client.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import ActionRow from '../actionRow.svelte';

	async function revokeAllSessions() {
		const confirmed = await openModal({
			title: 'Revoke all sessions',
			content: ConfirmSession
		});
		if (!confirmed) return;

		const { error } = await authClient.revokeSessions();

		if (error) {
			console.error(error);
			showToast(error.message ?? 'An error occurred revoking all sessions', 'error');
			return;
		}

		showToast('Successfully revoked all sessions', 'success');
		await refreshAll();
	}
</script>

{#snippet ConfirmSession({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<div>
		<p class="">This includes your current session. Revoking it will sign you out immediately.</p>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-error" onclick={confirm}>Confirm</button>
		</div>
	</div>
{/snippet}

<ActionRow
	title="Revoke all sessions"
	description="Signs you out of every device, including this one."
	icon={LogoutIcon}
	level="danger"
>
	<button class="btn btn-error btn-sm" onclick={revokeAllSessions}>Revoke</button>
</ActionRow>
