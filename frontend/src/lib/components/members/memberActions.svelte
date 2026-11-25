<script lang="ts">
	import { page } from '$app/state';
	import Section from '../Section.svelte';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { postAction } from '#lib/utils.ts';
	import type { OrgMemberDetail, OrgRole } from '#lib/interfaces.ts';
	import ActionRow from '../actionRow.svelte';
	import { goto, refreshAll } from '$app/navigation';
	import { openModal } from '../Modal/modalStore.svelte';
	import MailIcon from '@iconify-svelte/material-symbols/mail';
	import PersonRemoveIcon from '@iconify-svelte/material-symbols/person-remove';
	import ManageAccountsIcon from '@iconify-svelte/material-symbols/manage-accounts';

	let {
		member,
		meId,
		roles
	}: { member: OrgMemberDetail; meId: string | undefined; roles: Promise<OrgRole[]> } = $props();

	const orgPath = $derived(`/api/v1/organizations/${encodeURIComponent(page.params.orgId ?? '')}`);
	const isOwner = $derived(
		member.role
			.split(',')
			.map((r) => r.trim())
			.includes('owner')
	);
	// which action is running; the others disable while one is in flight
	let busy = $state<string | null>(null);

	// applicability, one derived per action
	const canResendWelcome = $derived(!member.emailVerified);
	const canRemove = $derived(
		member.userId !== meId &&
			!member.role
				.split(',')
				.map((r) => r.trim())
				.includes('owner')
	);
	const canChangeRole = $derived(!isOwner);

	async function run(
		id: string,
		path: string,
		opts: {
			success: string;
			error: string;
			method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
			body?: unknown;
			refresh?: boolean;
		}
	) {
		busy = id;
		try {
			const result = await postAction(`${orgPath}/${path}`, {
				method: opts.method,
				body: opts.body,
				errorMessage: opts.error
			});
			if (!result.ok) {
				showToast(result.error, 'error');
				return;
			}
			showToast(opts.success, 'success');
			if (opts.refresh) await refreshAll();
		} finally {
			busy = null;
		}
	}

	async function removeMember() {
		const confirmed = await openModal({
			title: 'Remove from organization',
			content: removeConfirmSnippet
		});
		if (!confirmed) return;

		busy = 'remove';
		try {
			const result = await postAction(`${orgPath}/members/${encodeURIComponent(member.id)}`, {
				method: 'DELETE',
				errorMessage: 'Unable to remove the member'
			});
			if (!result.ok) {
				showToast(result.error, 'error');
				return;
			}
			showToast(`${member.name} removed`, 'success');
			await goto(`/${encodeURIComponent(page.params.orgId ?? '')}/admin/users`);
		} finally {
			busy = null;
		}
	}
	let roleDraft = $state('');

	async function changeRole() {
		roleDraft = member.role; // preselect the current role when it's a single one
		const confirmed = await openModal({ title: 'Change role', content: roleModal });
		if (!confirmed || !roleDraft) return;

		await run('role', `members/${encodeURIComponent(member.id)}/role`, {
			method: 'PATCH',
			body: { role: roleDraft },
			success: `${member.name}'s role updated`,
			error: 'Unable to change the role',
			refresh: true
		});
	}
</script>

<Section title="Actions" children={actions} fullWidth />

{#snippet removeConfirmSnippet({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<p>
		Remove <strong>{member.name}</strong> from this organization? They lose access immediately. Their
		account and history are kept.
	</p>
	<div class="modal-action">
		<button class="btn" onclick={cancel}>Cancel</button>
		<button class="btn btn-error" onclick={confirm}>Remove</button>
	</div>
{/snippet}

{#snippet actions()}
	<div class="flex flex-col gap-4 px-6 py-4">
		<ActionRow
			title="Resend welcome email"
			description={canResendWelcome
				? `Sends another set-password link to ${member.email}.`
				: 'Not available: this member has already set up their account.'}
			icon={MailIcon}
		>
			<button
				class="btn btn-primary btn-sm"
				onclick={() =>
					run('resend-welcome', 'members/resend-welcome', {
						body: { email: member.email },
						success: `Welcome email sent to ${member.email}`,
						error: 'Unable to resend the welcome email'
					})}
				disabled={!canResendWelcome || busy !== null}
			>
				{busy === 'resend-welcome' ? 'Sending…' : 'Resend'}
			</button>
		</ActionRow>

		<ActionRow
			title="Change role"
			description={canChangeRole
				? 'Change what this member can do in the organization.'
				: "Not available: an owner's role can't be changed here."}
			icon={ManageAccountsIcon}
			level="warning"
		>
			<button
				class="btn btn-sm btn-warning"
				onclick={changeRole}
				disabled={!canChangeRole || busy !== null}
			>
				{busy === 'role' ? 'Saving…' : 'Change'}
			</button>
		</ActionRow>

		<ActionRow
			title="Remove from organization"
			description={canRemove
				? 'They lose access to this organization. Their account and history are kept.'
				: "Not available: owners and your own membership can't be removed here."}
			icon={PersonRemoveIcon}
			level="danger"
		>
			<button
				class="btn btn-error btn-sm"
				onclick={removeMember}
				disabled={!canRemove || busy !== null}
			>
				{busy === 'remove' ? 'Removing…' : 'Remove'}
			</button>
		</ActionRow>
	</div>
{/snippet}

{#snippet roleModal({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	{#await roles}
		<p class="py-4 text-sm text-base-content/70">Loading roles…</p>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
		</div>
	{:then list}
		{#if list.length === 0}
			<p class="text-sm text-warning">No roles are available to assign right now.</p>
			<div class="modal-action">
				<button class="btn" onclick={cancel}>Close</button>
			</div>
		{:else}
			{@const selected = list.find((r) => r.name === roleDraft)}
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Role</legend>
				<select class="select-bordered select w-full" bind:value={roleDraft}>
					<option value="" disabled>Select role</option>
					{#each list as r (r.name)}
						<option value={r.name} class="capitalize">{r.name}</option>
					{/each}
				</select>
				<p class="mt-1 min-h-5 text-xs text-base-content/60">{selected?.description ?? ''}</p>
			</fieldset>
			<div class="modal-action">
				<button class="btn" onclick={cancel}>Cancel</button>
				<button
					class="btn btn-primary"
					onclick={confirm}
					disabled={!roleDraft || roleDraft === member.role}
				>
					Save
				</button>
			</div>
		{/if}
	{/await}
{/snippet}
