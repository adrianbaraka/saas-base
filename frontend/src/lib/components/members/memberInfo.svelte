<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { page } from '$app/state';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import Section from '../Section.svelte';
	import { ModeControl, field, textInput } from '../formComponents.svelte';
	import type { OrgMemberDetail } from '#lib/interfaces.ts';
	import { formatDate, postAction } from '#lib/utils.ts';

	interface DraftType {
		name: string;
		phone: string[];
	}

	const MAX_PHONES = 5; // matches the backend maxItems

	let { member }: { member: OrgMemberDetail } = $props();

	const roles = $derived(
		member.role
			.split(',')
			.map((r) => r.trim())
			.filter(Boolean)
	);
	// the backend rejects owner edits, so don't offer them
	const allowEdit = $derived(!roles.includes('owner'));

	let mode = $state<'view' | 'edit'>('view');
	let saving = $state(false);

	function snapshot(): DraftType {
		return {
			name: member.name,
			phone: member.phone?.length ? [...member.phone] : ['']
		};
	}

	let draft = $state<DraftType>(snapshot());

	function setMode(next: 'view' | 'edit') {
		if (!allowEdit) return;
		if (next === 'edit') draft = snapshot();
		mode = next;
		(document.activeElement as HTMLElement)?.blur(); // closes the dropdown
	}

	function addPhone() {
		if (draft.phone.length < MAX_PHONES) draft.phone = [...draft.phone, ''];
	}

	function removePhone(index: number) {
		draft.phone = draft.phone.filter((_, i) => i !== index);
		if (draft.phone.length === 0) draft.phone = [''];
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			const result = await postAction(
				`/api/v1/organizations/${encodeURIComponent(page.params.orgId ?? '')}/members/${encodeURIComponent(member.id)}`,
				{
					method: 'PATCH',
					body: {
						name: draft.name.trim(),
						phone: draft.phone.map((p) => p.trim()).filter(Boolean)
					},
					errorMessage: 'Unable to update member details'
				}
			);

			if (!result.ok) {
				showToast(result.error, 'error');
				return; // stay in edit mode so nothing typed is lost
			}

			showToast('Member details updated', 'success');
			await refreshAll();
			mode = 'view';
		} finally {
			saving = false;
		}
	}
</script>

<Section title="Basic Information" badge={mc} children={info} fullWidth />

{#snippet mc()}
	{#if allowEdit}
		{@render ModeControl(mode, setMode)}
	{/if}
{/snippet}

{#snippet info()}
	<form class="flex flex-col gap-5" onsubmit={save}>
		<div class="flex flex-wrap">
			{#if mode === 'view'}
				{@render field('Name', member.name)}
				{@render field('Phone', member.phone?.join(', ') || '—')}
			{:else}
				{@render textInput('Name', draft.name, (v) => (draft.name = v))}

				<div class="grow basis-1/3 border-b border-base-200 px-6 py-4">
					<span class="text-xs font-medium tracking-widest text-base-content/70 uppercase">
						Phone
					</span>
					<div class="mt-1 flex flex-col gap-2">
						{#each draft.phone as _, i (i)}
							<div class="flex gap-2">
								<input
									type="tel"
									class="input-bordered input w-full input-sm"
									bind:value={draft.phone[i]}
									placeholder="Phone number"
									maxlength="20"
								/>
								<button
									type="button"
									class="btn btn-ghost btn-sm"
									onclick={() => removePhone(i)}
									disabled={draft.phone.length === 1 && !draft.phone[0]}
								>
									Remove
								</button>
							</div>
						{/each}
						<button
							type="button"
							class="btn self-start btn-ghost btn-sm"
							onclick={addPhone}
							disabled={draft.phone.length >= MAX_PHONES}
						>
							+ Add number
						</button>
					</div>
				</div>
			{/if}
		</div>

		{#if mode === 'view'}
			<div class="flex flex-wrap">
				<div class="grow basis-1/3 border-b border-base-200 px-6 py-4">
					<span class="text-xs font-medium tracking-widest text-base-content/70 uppercase">
						Role
					</span>
					<div class="mt-1 flex flex-wrap gap-1">
						{#each roles as r (r)}
							<span class="badge badge-ghost badge-sm capitalize">{r}</span>
						{/each}
					</div>
				</div>

				<div class="grow basis-1/3 border-b border-base-200 px-6 py-4">
					<span class="text-xs font-medium tracking-widest text-base-content/70 uppercase">
						Email
					</span>
					<div class="mt-1 flex items-center gap-2">
						<span class="text-sm font-medium text-base-content">{member.email}</span>
						{#if member.emailVerified}
							<div class="badge badge-xs badge-success">Verified</div>
						{:else}
							<div class="badge badge-xs badge-warning">Unverified</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex flex-wrap">
				{@render field('Joined', formatDate(member.joinedAt))}
			</div>
		{/if}

		{#if mode === 'edit'}
			<div class="flex justify-end gap-2">
				<button
					class="btn btn-ghost btn-lg"
					onclick={() => setMode('view')}
					disabled={saving}
					type="button"
				>
					Cancel
				</button>
				<button class="btn btn-lg btn-primary" disabled={saving} type="submit">
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>
		{/if}
	</form>
{/snippet}
