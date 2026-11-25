<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { authClient } from '#lib/auth-client.js';
	import Section from '../Section.svelte';
	import DeleteIcon from '@iconify-svelte/material-symbols/delete';
	import { showToast } from '../Toast/toastStore.svelte';
	import { openModal } from '../Modal/modalStore.svelte';
	import type { AuthError, UserSessionFull } from '#lib/interfaces.ts';

	let {
		sessions,
		mySession
	}: {
		sessions: UserSessionFull[];
		mySession: UserSessionFull;
	} = $props();

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
		const { error } = await authClient.revokeSession({
			token: sessionToDelete
		});
		e = error;

		loading = false;
		if (e) {
			showToast('An error occurred revoking the session.', 'error');
			console.error(e.message);
		} else {
			showToast('Successfully revoked the session.', 'success');
			await refreshAll();
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
		<div class="">
			<div class="badge badge-ghost badge-sm">{sessions.length} Sessions</div>
		</div>
	{/if}
{/snippet}

{#snippet UserSessions()}
	{#if sessions}
		<div class="max-h-96 overflow-x-auto overflow-y-auto">
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
					{#each sessions as session, index (index)}
						<tr>
							<th>{index + 1}</th>
							<td>{new Date(session.createdAt).toLocaleDateString()}</td>
							<td>{new Date(session.expiresAt).toLocaleString()}</td>
							<td>{session.ipAddress}</td>
							<td>{session.userAgent}</td>
							<td title="Revoke Session" aria-label="Revoke Session">
								<button
									class="btn cursor-pointer btn-ghost btn-sm"
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
							<td colspan="5" class="py-6 text-center text-base-content/60">No active sessions</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="text-error">No user sessions</div>
	{/if}
{/snippet}

<Section title="User Sessions" badge={NumberSessions} children={UserSessions} fullWidth />
