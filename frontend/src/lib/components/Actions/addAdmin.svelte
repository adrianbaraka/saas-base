<script lang="ts">
	import AddAdminIcon from '@iconify-svelte/material-symbols/person-add';

	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { submitJson } from '#lib/utils.ts';
	import { refreshAll } from '$app/navigation';

	const MAX_NAME_LENGTH = 100;

	let creating = $state(false);
	let name = $state('');
	let email = $state('');

	async function addAdmin() {
		name = '';
		email = '';

		const confirmed = await openModal({
			title: 'Add platform admin',
			content: AddAdminForm
		});
		if (!confirmed) return;

		const payload = { name: name.trim(), email: email.trim() };
		if (!payload.name || !payload.email) {
			showToast('Name and email are required.', 'error');
			return;
		}

		creating = true;
		try {
			const result = await submitJson('/api/v1/platform-admin/users', payload, {
				errorMessage: 'An error occurred creating the platform admin.'
			});

			if (!result.ok) {
				showToast(result.error, 'error');
				return;
			}

			showToast(`Invitation sent to ${payload.email}.`, 'success');
			await refreshAll();
		} finally {
			creating = false;
		}
	}
</script>

<button class="btn btn-sm btn-warning" disabled={creating} onclick={addAdmin}>
	{#if creating}
		<span class="loading loading-sm loading-spinner"></span>
	{:else}
		<AddAdminIcon height="20" />
	{/if}
	Add platform admin
</button>

{#snippet AddAdminForm({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			confirm();
		}}
	>
		<p>They will receive an email with a link to set their password.</p>

		<label class="mt-3 block">
			<span class="label-text">Name</span>
			<input
				class="input-bordered input mt-1 w-full"
				type="text"
				required
				maxlength={MAX_NAME_LENGTH}
				autocomplete="off"
				bind:value={name}
			/>
		</label>

		<label class="mt-3 block">
			<span class="label-text">Email</span>
			<input
				class="input-bordered input mt-1 w-full"
				type="email"
				required
				autocomplete="off"
				bind:value={email}
			/>
		</label>

		<div class="modal-action">
			<button class="btn" type="button" onclick={cancel}>Cancel</button>
			<button
				class="btn btn-primary"
				type="submit"
				disabled={name.trim().length < 1 || email.trim().length < 1}
			>
				Send invitation
			</button>
		</div>
	</form>
{/snippet}
