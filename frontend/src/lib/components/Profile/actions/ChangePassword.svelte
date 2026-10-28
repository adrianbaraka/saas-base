<script lang="ts">
	import KeyOutlineIcon from '@iconify-svelte/material-symbols/key-outline';
	import VisibilityIcon from '@iconify-svelte/material-symbols/visibility';
	import VisibilityOffIcon from '@iconify-svelte/material-symbols/visibility-off';
	import KeyIcon from '@iconify-svelte/material-symbols/key';
	import { authClient } from '#lib/auth-client.js'; // adjust path as needed
	import { showToast } from '../../Toast/toastStore.svelte';
	import { cancelModal, openModal } from '#lib/components/Modal/modalStore.svelte.js';

	let formEl: HTMLFormElement;

	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let oldPasswordVisible = $state(false);
	let newPasswordVisible = $state(false);
	let confirmPasswordVisible = $state(false);

	let submitting = $state(false);
	let errorMessage = $state('');

	let passwordsMismatch = $derived(confirmPassword.length > 0 && newPassword !== confirmPassword);
	let newEqOld = $derived(newPassword === oldPassword && newPassword.length > 0);
	let ok = $derived(
		oldPassword.length > 0 &&
			newPassword.length >= 8 &&
			newPassword === confirmPassword &&
			newPassword !== oldPassword
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!ok || submitting) return;

		submitting = true;
		errorMessage = '';

		const { error } = await authClient.changePassword({
			currentPassword: oldPassword,
			newPassword,
			revokeOtherSessions: true
		});

		submitting = false;

		if (error) {
			showToast(error.message ?? 'Failed to change password.', 'error');
			errorMessage = error.message ?? 'Failed to change password.';
			return;
		} else {
			showToast('Successfully updated password', 'success');
		}

		oldPassword = '';
		newPassword = '';
		confirmPassword = '';
		formEl.reset();
		cancelModal();
	}
	// validation and success messages
	let status = $derived.by(() => {
		if (errorMessage) return { type: 'error', text: errorMessage };
		if (newPassword.length > 0 && newPassword.length < 8)
			return { type: 'error', text: 'New password length must be at least 8 characters long' };
		if (passwordsMismatch) return { type: 'error', text: "Passwords don't match" };
		if (newEqOld) return { type: 'error', text: 'New Password cannot be the same as the old one.' };
		return null;
	});

	function requestNewPassword() {
		openModal({ title: 'Change Password', content: changeModal });
	}
</script>

{#snippet changeModal()}
	<form class="flex flex-col gap-4" onsubmit={handleSubmit} bind:this={formEl}>
		<label class="floating-label input validator" class:input-success={oldPassword.length > 0}>
			<span>Old Password</span>
			<KeyOutlineIcon height="20" />
			<input
				type={oldPasswordVisible ? 'text' : 'password'}
				required
				placeholder="Old Password"
				bind:value={oldPassword}
			/>
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm"
				aria-label={oldPasswordVisible ? 'Hide password' : 'Show password'}
				onclick={() => (oldPasswordVisible = !oldPasswordVisible)}
			>
				{#if oldPasswordVisible}
					<VisibilityOffIcon height="20" />
				{:else}
					<VisibilityIcon height="20" />
				{/if}
			</button>
		</label>

		<label
			class="floating-label input validator"
			class:input-success={newPassword.length >= 8}
			class:input-error={newEqOld}
		>
			<span>New Password</span>
			<KeyOutlineIcon height="20" />
			<input
				type={newPasswordVisible ? 'text' : 'password'}
				required
				minlength="8"
				placeholder="New Password"
				bind:value={newPassword}
			/>
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm"
				aria-label={newPasswordVisible ? 'Hide password' : 'Show password'}
				onclick={() => (newPasswordVisible = !newPasswordVisible)}
			>
				{#if newPasswordVisible}
					<VisibilityOffIcon height="20" />
				{:else}
					<VisibilityIcon height="20" />
				{/if}
			</button>
		</label>

		<label
			class="floating-label input validator"
			class:input-success={ok}
			class:input-error={passwordsMismatch}
		>
			<span>Confirm New Password</span>
			<KeyOutlineIcon height="20" />
			<input
				type={confirmPasswordVisible ? 'text' : 'password'}
				required
				placeholder="Confirm New Password"
				bind:value={confirmPassword}
			/>
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm"
				aria-label={confirmPasswordVisible ? 'Hide password' : 'Show password'}
				onclick={() => (confirmPasswordVisible = !confirmPasswordVisible)}
			>
				{#if confirmPasswordVisible}
					<VisibilityOffIcon height="20" />
				{:else}
					<VisibilityIcon height="20" />
				{/if}
			</button>
		</label>

		{#if status}
			<p
				class="text-xs -mt-2"
				class:text-error={status.type === 'error'}
				class:text-success={status.type === 'success'}
			>
				{status.text}
			</p>
		{/if}
		<div class="modal-action">
			<button class="btn" type="submit" disabled={!ok || submitting}>
				{submitting ? 'Changing...' : 'Change Password'}
			</button>
		</div>
	</form>
{/snippet}

<!-- trigger button -->
<button class="btn text-warning rounded-2xl flex flex-row gap-2" onclick={requestNewPassword}>
	<span>Reset my password</span>
	<KeyIcon height="24" />
</button>
