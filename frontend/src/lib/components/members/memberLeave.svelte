<script lang="ts">
	import ExitToAppIcon from '@iconify-svelte/material-symbols/exit-to-app';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '#lib/auth-client.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import ActionRow from '../actionRow.svelte';

	let leaving = $state(false);

	async function leave() {
		const organizationId = page.params.orgId;
		if (!organizationId) return;

		const confirmed = await openModal({
			title: 'Leave organization',
			content: ConfirmLeave
		});
		if (!confirmed) return;

		leaving = true;
		try {
			const { error } = await authClient.organization.leave({ organizationId });
			if (error) {
				console.error(error);
				showToast(error.message ?? 'Unable to leave the organization', 'error');
				return;
			}
			showToast('You left the organization', 'success');
			await goto('/login', { invalidateAll: true });
		} finally {
			leaving = false;
		}
	}
</script>

{#snippet ConfirmLeave({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<div>
		<p class="py-4">
			You will lose access to this organization immediately. An administrator would have to add you
			again. Your account is kept.
		</p>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-error" onclick={confirm}>Leave</button>
		</div>
	</div>
{/snippet}

<ActionRow
	title="Leave organization"
	description="Remove yourself from this organization. Your account and history are kept."
	icon={ExitToAppIcon}
	level="danger"
>
	<button class="btn btn-error btn-sm" onclick={leave} disabled={leaving}>
		{leaving ? 'Leaving…' : 'Leave'}
	</button>
</ActionRow>
