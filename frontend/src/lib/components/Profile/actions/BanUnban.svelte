<script lang="ts">
	import EnableIcon from '@iconify-svelte/material-symbols/enable';
	import BlockOutlineIcon from '@iconify-svelte/material-symbols/block-outline';
	import { refreshAll } from '$app/navigation';
	import type { BetterAuthUser } from '#lib';
	import { authClient } from '#lib/auth-client.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { isEffectivelyBanned } from '#lib/utils.js';
	import { openModal, cancelModal } from '#lib/components/Modal/modalStore.svelte.js';

	let { user, me }: { user: BetterAuthUser; me: BetterAuthUser } = $props();
	const myOwnPage = $derived(me.id === user.id ? true : false);
	const isAdmin = $derived(me.role?.includes('admin'));

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
			showToast(error.message ?? 'An error unbanning the user.', 'error');
		} else {
			showToast(`Successfully unbanned ${user.name}`, 'success');
			await refreshAll();
		}
	}

	// ban vars
	let banReason = $state('');
	let banDuration = $state('24h');
	const banDurationOptions = [
		//{ value: '1min', label: '1 minute', seconds: 60 },
		{ value: '1h', label: '1 hour', seconds: 60 * 60 },
		{ value: '24h', label: '24 hours', seconds: 60 * 60 * 24 },
		{ value: '1w', label: '1 week', seconds: 60 * 60 * 24 * 7 },
		{ value: '1m', label: '1 month', seconds: 60 * 60 * 24 * 30 }
	] as const;

	function requestBanUser() {
		if (myOwnPage) return; // cannot ban own self
		banReason = '';
		banDuration = '24h';

		openModal({
			title: `Ban ${user.name}`,
			content: BanUser
		});
	}

	async function submitBanUser() {
		const selected = banDurationOptions.find((o) => o.value === banDuration);
		if (!selected) return;

		const { error } = await authClient.admin.banUser({
			userId: user.id,
			banReason: banReason || undefined,
			banExpiresIn: selected.seconds
		});

		cancelModal();

		if (error) {
			console.error(error);
			showToast(error.message ?? 'An error occurred banning the user', 'error');
		} else {
			showToast(`User ${user.name} banned.`, 'success');
			await refreshAll();
		}
	}
</script>

{#snippet BanUser({ cancel }: { cancel: () => void })}
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
{/snippet}

{#if isAdmin && !myOwnPage}
	{#if isEffectivelyBanned(user.banned, user.banExpires)}
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
