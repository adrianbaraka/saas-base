<script lang="ts">
	import CloseIcon from '@iconify-svelte/material-symbols/cancel';

	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import type { req } from '#lib';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { refreshAll } from '$app/navigation';

	let { request }: { request: req } = $props();

	let rejecting = $state(false);
	let rejectionReason = $state('');

	async function rejectRequest() {
		rejectionReason = '';
		const confirmed = await openModal({
			title: 'Reject this tenant request?',
			content: ConfirmReject
		});
		if (!confirmed) return;

		if (!rejectionReason.trim()) {
			showToast('A rejection reason is required.', 'error');
			return;
		}

		rejecting = true;
		try {
			const res = await fetch(`/api/v1/tenants/reject-request/${request.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rejectionReason })
			});
			if (!res.ok) {
				throw new Error('An error occurred rejecting the request.');
			}
			showToast('Successfully rejected the tenancy request.', 'success');
			await refreshAll();
		} catch (error) {
			showToast('An error occurred.', 'error');
			console.error(error);
		}
		rejecting = false;
	}
</script>

<button
	class="btn btn-error rounded-2xl flex flex-row gap-2"
	disabled={rejecting || request.status !== 'pending'}
	onclick={rejectRequest}
>
	<span>Reject Request</span>
	<CloseIcon height="24" />
</button>

{#snippet ConfirmReject({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<div class="">
		<p class="">
			Rejecting <strong>{request.name}</strong> will notify <em>{request.requestedBy}</em> by email that
			their request was declined. Please provide a reason.
		</p>
		<textarea
			class="textarea textarea-bordered w-full mt-2"
			placeholder="Reason for rejection..."
			bind:value={rejectionReason}></textarea>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-error" onclick={confirm} disabled={rejectionReason.length < 1}
				>Reject Request</button
			>
		</div>
	</div>
{/snippet}
