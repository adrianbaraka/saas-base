<!-- the quick actions page 
	the actions snippet contains the main html markup
	in the script tag are the handlers for the different functions

	to add a modal add the name in the variable modalMode
	then here <Modal bind:this={modal} title={modalTitle}> add the html to show
	showing is by modal.show()
-->
<script lang="ts">
	import BlockOutlineIcon from '@iconify-svelte/material-symbols/block-outline';
	import EnableIcon from '@iconify-svelte/material-symbols/enable';
	import KeyIcon from '@iconify-svelte/material-symbols/key';
	import UpdateIcon from '@iconify-svelte/material-symbols/update';
	import LogoutIcon from '@iconify-svelte/material-symbols/logout';
	import Section from '../Section.svelte';
	import type { AuthError, BetterAuthUser } from '$lib';
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import Modal from '../Modal.svelte';
	import { showToast } from '../Toast/toastStore.svelte';

	let { user, me, isProfile }: { user: BetterAuthUser; me: BetterAuthUser; isProfile: boolean } =
		$props();

	// Modal configs
	let modal: ReturnType<typeof Modal>;
	let modalTitle = $state('');
	let modalMode: 'revokeAll' | 'ban' | 'edit' | null = $state(null);

	const myOwnPage = $derived(user.id === me.id);
	const isAdmin = $derived(me.role === 'admin');
	const possessive = $derived(myOwnPage ? 'my' : 'user');

	///////////////////////////////////////////////////////////////////////////
	// handle revoke sessions either admin or normal user
	///////////////////////////////////////////////////////////////////////////
	async function revokeAllSessions() {
		if (myOwnPage) {
			//confirm deletion of all sessions including current
			modalTitle = 'Revoke all sessions?';
			modalMode = 'revokeAll';
			const confirmed = await modal.show();
			if (!confirmed) {
				return;
			}
		}
		let e: AuthError | null = null;
		if (isAdmin) {
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
			showToast(e.message ?? 'An error occurred revoking all sessions', "error")
		} else {
			showToast('Successfully revoked all sessions', "success")
			await invalidateAll();
		}
	}

	///////////////////////////////////////////////////////////////////////////
	// handle ban and unban user (admin)
	///////////////////////////////////////////////////////////////////////////

	async function unBanUser() {
		if (!user.banned) {
			console.error('The user is not banned.');
			return;
		}
		const { error } = await authClient.admin.unbanUser({
			userId: user.id
		});
		if (error) {
			console.error(error);
			showToast(error.message ?? 'An error unbanning the user.', "error")
		} else {
			showToast(`Successfully unbanned ${user.name}`, "success")
			await invalidateAll();
		}
	}

	// ban vars
	let banReason = $state('');
	let banDuration = $state('24h');
	const banDurationOptions = [
		{ value: '1h', label: '1 hour', seconds: 60 * 60 },
		{ value: '24h', label: '24 hours', seconds: 60 * 60 * 24 },
		{ value: '1w', label: '1 week', seconds: 60 * 60 * 24 * 7 },
		{ value: '1m', label: '1 month', seconds: 60 * 60 * 24 * 30 }
	] as const;

	function requestBanUser() {
		if (myOwnPage) return; // cannot ban own self
		banReason = '';
		banDuration = '24h';
		modalMode = 'ban';
		modalTitle = 'Ban user?';
		modal.show();
	}

	async function submitBanUser() {
		const selected = banDurationOptions.find((o) => o.value === banDuration);
		if (!selected) return;

		const { error } = await authClient.admin.banUser({
			userId: user.id,
			banReason: banReason || undefined,
			banExpiresIn: selected.seconds
		});

		modal.close();

		if (error) {
			console.error(error);
			showToast(error.message ?? 'An error occurred banning the user', "error")
		} else {
			showToast(`User ${user.name} banned.`, "success")
			await invalidateAll();
		}
	}


	///////////////////////////////////////////////////////////////////////////
	// update user details
	///////////////////////////////////////////////////////////////////////////

	let editName = $state('');
	function requestEditUser() {
		editName = user.name ?? '';
		modalMode = 'edit';
		modalTitle = 'Edit user';
		modal.show();
	}
	async function submitEditUser() {
		if (editName === user.name) {
			modal.close();
			return;
		}

		let e: AuthError | null;
		if (myOwnPage) {
			const { error } = await authClient.updateUser({ name: editName });
			e = error;
		} else if (isAdmin) {
			const { error } = await authClient.admin.updateUser({
				userId: user.id,
				data: { name: editName }
			});
			e = error;
		} else {
			return; // shouldn't be reachable
		}

		modal.close();

		if (e) {
			console.error(e);
			showToast(e.message ?? 'An error occurred updating the user', "error")
		} else {
			showToast("User details updated", "success")
			await invalidateAll();
		}
	}

</script>

<Modal bind:this={modal} title={modalTitle}>
	{#snippet children({ confirm, cancel })}
		<!-- revoke all sessions modal -->
		{#if modalMode === 'revokeAll'}
			<div>
				<p class="py-4">
					This includes your current session. Revoking it will sign you out immediately.
				</p>
				<div class="modal-action">
					<button class="btn" onclick={cancel}>Cancel</button>
					<button class="btn btn-error" onclick={confirm}>Confirm</button>
				</div>
			</div>

			<!-- Ban user modal -->
		{:else if modalMode === 'ban'}
			<div class="flex flex-col gap-4 py-4">
				<label class="form-control">
					<fieldset class="fieldset">
						<legend class="fieldset-legend">Reason</legend>
						<textarea
							bind:value={banReason}
							class="textarea h-24"
							placeholder="Why is this user being banned?"></textarea>
						<div class="label">Optional</div>
					</fieldset>
				</label>

				<label class="form-control">
					<fieldset class="fieldset">
						<legend class="fieldset-legend">Ban duration</legend>
						<select bind:value={banDuration} class="select select-bordered">
							{#each banDurationOptions as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</fieldset>
				</label>

				<div class="modal-action">
					<button class="btn" onclick={cancel}>Cancel</button>
					<button class="btn btn-error" onclick={submitBanUser}>Ban User</button>
				</div>
			</div>

			<!-- Update user details -->
		{:else if modalMode === 'edit'}
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
		{/if}
	{/snippet}
</Modal>

{#snippet Actions()}
	<div class="flex flex-col gap-5 p-2">
		<button class="btn rounded-2xl text-sky-400 flex flex-row gap-2" onclick={requestEditUser}>
			<span>Update {possessive} Details</span>
			<UpdateIcon height="24" />
		</button>


		<!-- TODO implement sending password reset link -->
		<button class="btn text-warning rounded-2xl flex flex-row gap-2">
			<span>Reset {possessive} password</span>
			<KeyIcon height="24" />
		</button>
		{#if isAdmin && !isProfile && !myOwnPage}
			{#if user.banned}
				<button class="btn text-success rounded-2xl flex flex-row gap-2" onclick={unBanUser}>
					<span>Unban User</span>
					<EnableIcon height="24" />
				</button>
			{:else}
				<button class="btn text-error rounded-2xl flex flex-row gap-2" onclick={requestBanUser}>
					<span>Ban User</span>
					<BlockOutlineIcon height="24" />
				</button>
			{/if}
		{/if}

		<button class="btn text-error rounded-2xl flex flex-row gap-4" onclick={revokeAllSessions}>
			<span>Revoke all {possessive} sessions</span>
			<LogoutIcon height="24" />
		</button>
	</div>
{/snippet}


<!-- main page -->
<Section title="Quick Actions" children={Actions} vertical />
