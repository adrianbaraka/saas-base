<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { BetterAuthUser } from '$lib';
	import { openModal } from '../Modal/modal.svelte';
	import Section from '../Section.svelte';
	import { showToast } from '../Toast/toastStore.svelte';

	let {
		user,
		me,
		roles,
		isProfile
	}: {
		user: BetterAuthUser;
		me: BetterAuthUser;
		roles: { name: string; description: string }[];
		isProfile: boolean;
	} = $props();

	const myOwnPage = $derived(user.id === me.id);
	const isAdmin = $derived(me.role === 'admin');

	let selectedRole = $derived(user.role);
	let pendingRole = $state('');
	let updatingRole = $state(false);

	async function handleRoleChange(event: Event) {
		const newRole = (event.target as HTMLSelectElement).value;
		if (newRole === user.role) return;

		if (myOwnPage) {
			pendingRole = newRole;
			//const confirmed = await modal.show();
			const confirmed = await openModal({
				title: "Change your own role?",
				content: ConfirmRoleChange
			})
			if (!confirmed) {
				selectedRole = user.role;
				return;
			}
		}

		await updateRole(newRole);
	}

	async function updateRole(newRole: string) {
		updatingRole = true;

		try {
			const res = await fetch('/api/auth/admin/set-role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					role: newRole
				})
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? 'Failed to update role');
			}
			showToast(`Role updated to ${newRole}`, 'success')
			await invalidateAll();
		} catch (err) {
			console.error(err);
			selectedRole = user.role;
			showToast('An error occurred updating the role', "error")
		} finally {
			updatingRole = false;
		}
	}
</script>


{#if isAdmin && !isProfile}
	<Section title="Role" children={roleContent} badge={CurrentRole} vertical />
{/if}

{#snippet roleContent()}
	<label class="form-control">
		<div class="label">
			<span class="label-text">Role</span>
		</div>
		<select
			bind:value={selectedRole}
			class="select select-bordered"
			disabled={updatingRole}
			onchange={handleRoleChange}
		>
			{#each roles as role}
				<option value={role.name}>{role.name}</option>
			{/each}
		</select>
		<div class="label mt-2">
			<span class="label-text-alt max-w-80 w-80 text-wrap">
				{roles.find((r) => r.name === selectedRole)?.description ?? ''}
			</span>
		</div>
	</label>
{/snippet}

{#snippet CurrentRole()}
	<div class="badge badge-ghost badge-sm">{user.role}</div>
{/snippet}

	{#snippet ConfirmRoleChange({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
		<div>
			<p class="py-4">
				You're changing your own role to <strong>{pendingRole}</strong>. If this removes your admin
				access, you may lose the ability to manage users, including reverting this change yourself.
			</p>
			<div class="modal-action">
				<button class="btn" onclick={cancel}>Cancel</button>
				<button class="btn btn-error" onclick={confirm}>Confirm</button>
			</div>
		</div>
	{/snippet}

<!-- <Modal bind:this={modal} title="Change your own role?">
	{#snippet children({ confirm, cancel })}
		<div>
			<p class="py-4">
				You're changing your own role to <strong>{pendingRole}</strong>. If this removes your admin
				access, you may lose the ability to manage users, including reverting this change yourself.
			</p>
			<div class="modal-action">
				<button class="btn" onclick={cancel}>Cancel</button>
				<button class="btn btn-error" onclick={confirm}>Confirm</button>
			</div>
		</div>
	{/snippet}
</Modal> -->
