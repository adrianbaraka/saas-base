<script lang="ts">
	import AddOrgIcon from '@iconify-svelte/material-symbols/add-business';

	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { submitJson } from '#lib/utils.ts';
	import { refreshAll } from '$app/navigation';

	const MIN_NAME_LENGTH = 2;
	const MAX_NAME_LENGTH = 100;
	const MAX_EMAIL_LENGTH = 254;

	let creating = $state(false);
	let organizationName = $state('');
	let ownerName = $state('');
	let email = $state('');

	const valid = $derived(
		organizationName.trim().length >= MIN_NAME_LENGTH &&
			ownerName.trim().length >= MIN_NAME_LENGTH &&
			email.trim().length > 0
	);

	async function addTenant() {
		organizationName = '';
		ownerName = '';
		email = '';

		const confirmed = await openModal({
			title: 'Add tenant',
			content: AddTenantForm
		});
		if (!confirmed) return;

		const payload = {
			organizationName: organizationName.trim(),
			ownerName: ownerName.trim(),
			email: email.trim()
		};
		if (
			payload.organizationName.length < MIN_NAME_LENGTH ||
			payload.ownerName.length < MIN_NAME_LENGTH ||
			!payload.email
		) {
			showToast('Organization name, owner name and email are required.', 'error');
			return;
		}

		creating = true;
		try {
			const result = await submitJson('/api/v1/platform-admin/organizations', payload, {
				errorMessage: 'An error occurred creating the tenant.'
			});

			if (!result.ok) {
				showToast(result.error, 'error');
				return;
			}

			showToast(`Created ${payload.organizationName}.`, 'success');
			await refreshAll();
		} finally {
			creating = false;
		}
	}
</script>

<button class="btn btn-sm btn-warning" disabled={creating} onclick={addTenant}>
	{#if creating}
		<span class="loading loading-sm loading-spinner"></span>
	{:else}
		<AddOrgIcon height="20" />
	{/if}
	Add tenant
</button>

{#snippet AddTenantForm({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			confirm();
		}}
	>
		<p>
			Creates the organization directly, without a request. If the owner has no account yet, one is
			created for them.
		</p>

		<label class="mt-3 block">
			<span class="label-text">Organization name</span>
			<input
				class="input-bordered input mt-1 w-full"
				type="text"
				required
				minlength={MIN_NAME_LENGTH}
				maxlength={MAX_NAME_LENGTH}
				autocomplete="off"
				bind:value={organizationName}
			/>
		</label>

		<label class="mt-3 block">
			<span class="label-text">Owner name</span>
			<input
				class="input-bordered input mt-1 w-full"
				type="text"
				required
				minlength={MIN_NAME_LENGTH}
				maxlength={MAX_NAME_LENGTH}
				autocomplete="off"
				bind:value={ownerName}
			/>
		</label>

		<label class="mt-3 block">
			<span class="label-text">Owner email</span>
			<input
				class="input-bordered input mt-1 w-full"
				type="email"
				required
				maxlength={MAX_EMAIL_LENGTH}
				autocomplete="off"
				bind:value={email}
			/>
		</label>

		<div class="modal-action">
			<button class="btn" type="button" onclick={cancel}>Cancel</button>
			<button class="btn btn-primary" type="submit" disabled={!valid}>Create tenant</button>
		</div>
	</form>
{/snippet}
