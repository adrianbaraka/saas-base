<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import KeyOutlineIcon from '@iconify-svelte/material-symbols/key-outline';
	import VisibilityIcon from '@iconify-svelte/material-symbols/visibility';
	import VisibilityOffIcon from '@iconify-svelte/material-symbols/visibility-off';

	import { authClient } from '$lib/auth-client';
	import { showToast } from '$lib/components/Toast/toastStore.svelte';

	const token = $derived(page.url.searchParams.get('token'));
	const linkError = $derived(page.url.searchParams.get('error'));

	let passwordVisible = $state(false);
	let confirmVisible = $state(false);
	let loading = $state(false);
	let errorVisible = $state(false);
	let password = $state('');
	let confirmPassword = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorVisible = false;

		if (password.length < 8) {
			showToast('Password must be at least 8 characters', 'error');
			errorVisible = true;
			setTimeout(() => (errorVisible = false), 5000);
			return;
		}
		if (password !== confirmPassword) {
			showToast('Passwords do not match', 'error');
			errorVisible = true;
			setTimeout(() => (errorVisible = false), 5000);
			return;
		}
		if (!token) {
			showToast('Missing reset token', 'error');
			return;
		}

		loading = true;
		try {
			const res = await authClient.resetPassword({
				newPassword: password,
				token
			});

			if (res.error) {
				throw new Error(res.error.message);
			}

			showToast('Password set — you can log in now', 'success');
			await goto('/login?setup=success');
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Failed to set password', 'error');
			console.error(e instanceof Error && e.message);

			errorVisible = true;
			setTimeout(() => (errorVisible = false), 5000);
		} finally {
			loading = false;
		}
	}
</script>

<section class="mt-10 flex flex-col items-center justify-center gap-10">
	{#if linkError === 'INVALID_TOKEN'}
		<div class="flex w-fit flex-col items-center gap-4 rounded-xl bg-base-200 p-5 shadow-xl">
			<div class="text-2xl">Link expired</div>
			<p class="max-w-xs text-center text-base-content/70">
				This invite link is invalid or has expired. Ask an admin to send you a new one.
			</p>
		</div>
	{:else if !token}
		<div class="flex w-fit flex-col items-center gap-4 rounded-xl bg-base-200 p-5 shadow-xl">
			<div class="text-2xl">Invalid link</div>
			<p class="max-w-xs text-center text-base-content/70">
				This link is missing a token. Please use the link from your invite email.
			</p>
		</div>
	{:else}
		<form
			class="flex w-fit flex-col items-center justify-center gap-8 rounded-xl bg-base-200 p-5 shadow-xl"
			onsubmit={handleSubmit}
		>
			<div class="flex flex-col items-center gap-1">
				<div class="text-2xl">Welcome to #TODO</div>
				<p class="text-sm text-base-content/70">First, set your password to finish setup</p>
			</div>

			<!-- password -->
			<label class="validator input" class:input-error={errorVisible}>
				<KeyOutlineIcon height="20" />
				<input
					type={passwordVisible ? 'text' : 'password'}
					required
					placeholder="New password"
					minlength="8"
					bind:value={password}
					autocomplete="new-password"
				/>
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-sm"
					onclick={() => (passwordVisible = !passwordVisible)}
				>
					{#if passwordVisible}
						<VisibilityOffIcon height="20" />
					{:else}
						<VisibilityIcon height="20" />
					{/if}
				</button>
			</label>

			<!-- confirm password -->
			<label class="validator input" class:input-error={errorVisible}>
				<KeyOutlineIcon height="20" />
				<input
					type={confirmVisible ? 'text' : 'password'}
					required
					placeholder="Confirm password"
					minlength="8"
					bind:value={confirmPassword}
					autocomplete="new-password"
				/>
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-sm"
					onclick={() => (confirmVisible = !confirmVisible)}
				>
					{#if confirmVisible}
						<VisibilityOffIcon height="20" />
					{:else}
						<VisibilityIcon height="20" />
					{/if}
				</button>
			</label>

			<!-- Submit button -->
			<button class="btn btn-primary" disabled={loading}>
				{#if loading}
					<span class="loading loading-spinner"></span>
				{/if}
				Set password
			</button>
		</form>
	{/if}
</section>