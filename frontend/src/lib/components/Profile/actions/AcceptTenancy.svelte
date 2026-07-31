<script lang="ts">
	import CheckIcon from '@iconify-svelte/material-symbols/check-circle';

	import { openModal } from '$lib/components/Modal/modalStore.svelte';
	import type { req } from '$lib';
	import { showToast } from '$lib/components/Toast/toastStore.svelte';
	import { invalidateAll } from '$app/navigation';

	let { request }: { request: req } = $props();

	let accepting = $state(false);

	async function acceptRequest() {
		const confirmed = await openModal({
			title: 'Approve this tenant request?',
			content: ConfirmAccept
		});
		if (!confirmed) return;

		accepting = true;
		try {
			const res = await fetch(`/api/v1/tenants/accept-request/${request.id}`, {
				method: 'POST'
			});
			if (!res.ok) {
				throw new Error('An error occurred accepting the request.');
			}
			showToast('SuccessFully accepted the tenancy request.', 'success');
			await invalidateAll();
		} catch (error) {
			showToast('An error occurred.', 'error');
			console.error(error);
		}
		accepting = false;
	}
</script>

<button
	class="btn btn-success rounded-2xl flex flex-row gap-2"
	disabled={accepting || request.status !== "pending"}
	onclick={acceptRequest}
>
	<span>Approve Request</span>
	<CheckIcon height="24" />
</button>


{#snippet ConfirmAccept({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<div class="">
		<p class="">
			Approving <strong>{request.name}</strong> will create a new tenant and make
			<em>{request.requestedBy}</em> its admin. An email will be sent to them letting them know
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
