<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { authClient } from '#lib/auth-client.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import Section from '../Section.svelte';
	import { ModeControl, field, textInput } from '../formComponents.svelte';
	import type { BetterAuthUser } from '#lib/interfaces.ts';
	import { formatDate } from '#lib/utils.ts';

	export interface draftType {
		name: string;
		phone: string[];
	}

	let { user }: { user: BetterAuthUser } = $props();

	async function onSave(draft: draftType) {
		const { error } = await authClient.updateUser({
			name: draft.name,
			phone: draft.phone.map((p) => p.trim()).filter(Boolean)
		});

		if (error) {
			console.error(error);
			showToast(error.message ?? 'An error occurred updating your details', 'error');
		} else {
			showToast('Your details were updated', 'success');
			await refreshAll();
		}
	}

	let mode = $state<'view' | 'edit'>('view');
	let saving = $state(false);

	function snapshot(): draftType {
		return {
			name: user.name ?? '',
			phone: user.phone && user.phone.length > 0 ? [...user.phone] : ['']
		};
	}

	let draft = $state<draftType>(snapshot());

	function startEdit() {
		draft = snapshot();
		mode = 'edit';
	}

	function cancelEdit() {
		mode = 'view';
	}

	function setMode(next: 'view' | 'edit') {
		mode = next;
		if (next === 'edit') startEdit();
		(document.activeElement as HTMLElement)?.blur();
	}

	function addPhone() {
		draft.phone = [...draft.phone, ''];
	}

	function removePhone(index: number) {
		draft.phone = draft.phone.filter((_, i) => i !== index);
		if (draft.phone.length === 0) draft.phone = [''];
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			await onSave(draft);
			mode = 'view';
		} finally {
			saving = false;
		}
	}
</script>

<Section title="Basic Information" badge={mcOrBanned} children={info} fullWidth />

{#snippet mcOrBanned()}
	<div class="">
		{@render ModeControl(mode, setMode)}
	</div>
{/snippet}

{#snippet info()}
	<form class="flex flex-col gap-5" onsubmit={save}>
		<div class="flex flex-wrap">
			{#if mode === 'view'}
				{@render field('Name', user.name)}
				{@render field('Phone', user.phone?.join(', ') || '—')}
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
						<button type="button" class="btn self-start btn-ghost btn-sm" onclick={addPhone}>
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
						Email
					</span>
					<div class="mt-1 flex items-center gap-2">
						<span class="text-sm font-medium text-base-content">{user.email}</span>
						{#if user.emailVerified}
							<div class="badge badge-xs badge-success">Verified</div>
						{:else}
							<div class="badge badge-xs badge-warning">Unverified</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex flex-wrap">
				{@render field('Joined', formatDate(user.createdAt))}
				{@render field('Last Updated', formatDate(user.updatedAt))}
			</div>
		{/if}
		{#if mode === 'edit'}
			<div class="flex justify-end gap-2">
				<button class="btn btn-ghost btn-lg" onclick={cancelEdit} disabled={saving} type="reset">
					Cancel
				</button>
				<button class="btn btn-lg btn-primary" disabled={saving} type="submit">
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>
		{/if}
	</form>
{/snippet}
