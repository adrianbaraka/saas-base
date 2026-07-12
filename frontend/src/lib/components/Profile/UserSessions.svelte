<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { AuthError, BetterAuthUser, UserSessionFull } from '$lib';
	import { authClient } from '$lib/auth-client';
	import Section from '../Section.svelte';
	import DeleteIcon from '@iconify-svelte/material-symbols/delete';
	import { showToast } from '../Toast/toastStore.svelte';
	import { openModal } from '../Modal/modalStore.svelte';

	let {
		sessions,
		mySession,
		me,
		isProfile
	}: {
		sessions: UserSessionFull[];
		mySession: UserSessionFull;
		me: BetterAuthUser;
		isProfile: boolean;
	} = $props();

	const isAdmin = $derived(me.role === 'admin');

	let sessionToDelete = $state('');
	let loading = $state(false);

	async function revokeSession() {
		loading = true;
		// show confirmation if session to delete is the current one
		if (sessionToDelete === mySession.token) {
			const confirmed = await openModal({
				title: 'Revoke session?',
				content: ConfirmSessionDelete
			});
			if (!confirmed) {
				loading = false;
				return;
			}
		}
		let e: AuthError | null = null;
		if (isAdmin && !isProfile) {
			const { error } = await authClient.admin.revokeUserSession({
				sessionToken: sessionToDelete
			});
			e = error;
		} else {
			const { error } = await authClient.revokeSession({
				token: sessionToDelete
			});
			e = error;
		}

		loading = false;
		if (e) {
			showToast('An error occurred revoking the session.', 'error');
			console.error(e.message);
		} else {
			showToast('Successfully revoked the session.', 'success');
			await invalidateAll();
		}
	}
</script>

{#snippet ConfirmSessionDelete({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<!-- revoke all sessions modal -->
	<div>
		<p class="py-4">This is your current session. Revoking it will sign you out immediately.</p>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-error" onclick={confirm}>Confirm</button>
		</div>
	</div>
{/snippet}

<!-- components -->
{#snippet NumberSessions()}
	{#if sessions}
		<div class="aura aura-silver">
			<div class="badge badge-ghost badge-sm">{sessions.length} Sessions</div>
		</div>
	{/if}
{/snippet}

{#snippet UserSessions()}
	{#if sessions}
		<div class="overflow-x-auto overflow-y-auto max-h-96">
			<table class="table table-zebra">
				<thead>
					<tr>
						<th></th>
						<th class="text-base-content">Created At</th>
						<th class="text-base-content">Expires At</th>
						<th class="text-base-content">IP Address</th>
						<th class="text-base-content">User Agent</th>
						<th class="text-base-content">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each sessions as session, index}
						<tr>
							<th>{index + 1}</th>
							<td>{new Date(session.createdAt).toLocaleDateString()}</td>
							<td>{new Date(session.expiresAt).toLocaleString()}</td>
							<td>{session.ipAddress}</td>
							<td>{session.userAgent}</td>
							<td title="Revoke Session" aria-label="Revoke Session">
								<button
									class="btn btn-ghost btn-sm cursor-pointer"
									disabled={loading ? true : false}
									onclick={() => {
										sessionToDelete = session.token;
										revokeSession();
									}}
								>
									<DeleteIcon height="20" class="text-error" aria-label="Revoke session button" />
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="text-center text-base-content/60 py-6">No active sessions</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="text-error">No user sessions</div>
	{/if}
{/snippet}

<Section title="User Sessions" badge={NumberSessions} children={UserSessions} />
