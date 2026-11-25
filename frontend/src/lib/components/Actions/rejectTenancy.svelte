<script lang="ts">
	import CloseIcon from '@iconify-svelte/material-symbols/cancel';

	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import type { TenantRequest } from '#lib/interfaces.ts';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { submitJson } from '#lib/utils.ts';
	import { refreshAll } from '$app/navigation';

	const MAX_REASON_LENGTH = 500;

	let { request }: { request: TenantRequest } = $props();

	let rejecting = $state(false);
	let rejectionReason = $state('');

	async function rejectRequest() {
		rejectionReason = '';
		const confirmed = await openModal({
			title: 'Reject this tenant request?',
			content: ConfirmReject
		});
		if (!confirmed) return;

		const reason = rejectionReason.trim();
		if (!reason) {
			showToast('A rejection reason is required.', 'error');
			return;
		}

		rejecting = true;
		try {
			const result = await submitJson(
				`/api/v1/platform-admin/org-requests/${encodeURIComponent(request.id)}/reject`,
				{ reason },
				{ errorMessage: 'An error occurred rejecting the request.' }
			);

			if (!result.ok) {
				showToast(result.error, 'error');
				// request was already handled or no longer exists: the row on screen is stale
				if (result.status === 409 || result.status === 404) await refreshAll();
				return;
			}

			showToast('Successfully rejected the tenancy request.', 'success');
			await refreshAll();
		} finally {
			rejecting = false;
		}
	}
</script>

<button
	class="btn btn-square rounded-2xl btn-error btn-sm"
	disabled={rejecting || request.status !== 'pending'}
	onclick={rejectRequest}
	aria-label="Reject request"
	title="Reject request"
>
	{#if rejecting}
		<span class="loading loading-sm loading-spinner"></span>
	{:else}
		<CloseIcon height="20" />
	{/if}
</button>

{#snippet ConfirmReject({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<div>
		<p>
			Rejecting <strong>{request.organizationName}</strong> will notify
			<em>{request.requesterName}</em> by email that their request was declined. Please provide a reason.
		</p>
		<textarea
			class="textarea-bordered textarea mt-2 w-full"
			placeholder="Reason for rejection..."
			maxlength={MAX_REASON_LENGTH}
			bind:value={rejectionReason}></textarea>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-error" onclick={confirm} disabled={rejectionReason.trim().length < 1}>
				Reject Request
			</button>
		</div>
	</div>
{/snippet}
