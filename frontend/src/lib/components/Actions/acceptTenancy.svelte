<script lang="ts">
	import CheckIcon from '@iconify-svelte/material-symbols/check-circle';

	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import type { TenantRequest } from '#lib/interfaces.ts';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { postAction } from '#lib/utils.ts';
	import { refreshAll } from '$app/navigation';

	let { request }: { request: TenantRequest } = $props();

	let accepting = $state(false);

	async function acceptRequest() {
		const confirmed = await openModal({
			title: 'Approve this tenant request?',
			content: ConfirmAccept
		});
		if (!confirmed) return;

		accepting = true;
		try {
			const result = await postAction(
				`/api/v1/platform-admin/org-requests/${encodeURIComponent(request.id)}/approve`,
				{ errorMessage: 'An error occurred accepting the request.' }
			);

			if (!result.ok) {
				showToast(result.error, 'error');
				return;
			}

			showToast('Successfully accepted the tenancy request.', 'success');
			await refreshAll();
		} finally {
			accepting = false;
		}
	}
</script>

<button
	class="btn btn-square rounded-2xl btn-sm btn-success"
	disabled={accepting || request.status !== 'pending'}
	onclick={acceptRequest}
	aria-label="Approve request"
	title="Approve request"
>
	{#if accepting}
		<span class="loading loading-sm loading-spinner"></span>
	{:else}
		<CheckIcon height="20" />
	{/if}
</button>
{#snippet ConfirmAccept({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<div>
		<p>
			Approving <strong>{request.organizationName}</strong> will create a new tenant and make
			<em>{request.requesterName}</em> its admin. An email will be sent to them letting them know
			their request was approved.
			<br />
			Continue?
		</p>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-success" onclick={confirm}>Approve & Create Tenant</button>
		</div>
	</div>
{/snippet}
