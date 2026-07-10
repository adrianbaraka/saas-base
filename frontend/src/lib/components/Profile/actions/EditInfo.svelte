<script lang="ts">
	import UpdateIcon from '@iconify-svelte/material-symbols/update';
	import { invalidateAll } from '$app/navigation';
	import type { AuthError, BetterAuthUser } from '$lib';
	import { authClient } from '$lib/auth-client';
	import { cancelModal, openModal } from '$lib/components/Modal/modal.svelte';
	import { showToast } from '$lib/components/Toast/toastStore.svelte';

	let { me, user, isProfile }: { me: BetterAuthUser; user: BetterAuthUser; isProfile: boolean } =
		$props();

	const isAdmin = $derived(me.role?.includes('admin'));
	const possessive = $derived(isProfile ? 'my' : 'user');

	let editName = $state('');
	function requestEditUser() {
		editName = user.name ?? '';
		openModal({
			title: 'Edit User',
			content: EditModal
		});
	}
	async function submitEditUser() {
		if (editName === user.name) {
			cancelModal();
			return;
		}

		let e: AuthError | null;
		if (isProfile) {
			const { error } = await authClient.updateUser({ name: editName });
			e = error;
		} else if (isAdmin) {
			const { error } = await authClient.admin.updateUser({
				userId: user.id,
				data: { name: editName }
			});
			e = error;
		} else {
			console.log('here');

			return; // shouldn't be reachable
		}

		//modal.close();
		cancelModal();

		if (e) {
			console.error(e);
			showToast(e.message ?? 'An error occurred updating the user', 'error');
		} else {
			showToast('User details updated', 'success');
			await invalidateAll();
		}
	}
</script>

{#snippet EditModal({ cancel }: { cancel: () => void })}
	<div class="flex flex-col gap-4 py-4">
		<label class="form-control">
			<div class="label">
				<span class="label-text">Name</span>
			</div>
			<input
				bind:value={editName}
				type="text"
				class="input input-bordered"
				placeholder="Full name"
			/>
		</label>

		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button
				class="btn btn-primary"
				disabled={!editName.trim() || editName === user.name}
				onclick={submitEditUser}
			>
				Save Changes
			</button>
		</div>
	</div>
{/snippet}

<button class="btn rounded-2xl text-sky-400 flex flex-row gap-2" onclick={requestEditUser}>
	<span>Update {possessive} Details</span>
	<UpdateIcon height="24" />
</button>
