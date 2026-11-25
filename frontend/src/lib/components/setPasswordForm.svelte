<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import KeyOutlineIcon from '@iconify-svelte/material-symbols/key-outline';
	import VisibilityIcon from '@iconify-svelte/material-symbols/visibility';
	import VisibilityOffIcon from '@iconify-svelte/material-symbols/visibility-off';

	import { authClient } from '#lib/auth-client.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';

	interface Props {
		title: string;
		subtitle?: string;
		submitLabel?: string;
		successMessage: string;
		redirectTo?: string;
		expiredMessage: string;
		missingTokenMessage: string;
	}

	let {
		title,
		subtitle,
		submitLabel = 'Set password',
		successMessage,
		redirectTo = '/login',
		expiredMessage,
		missingTokenMessage
	}: Props = $props();

	const token = $derived(page.url.searchParams.get('token'));
	const linkError = $derived(page.url.searchParams.get('error'));

	let passwordVisible = $state(false);
	let confirmVisible = $state(false);
	let loading = $state(false);
	let errorVisible = $state(false);
	let password = $state('');
	let confirmPassword = $state('');

	function flagError(message: string) {
		showToast(message, 'error');
		errorVisible = true;
		setTimeout(() => (errorVisible = false), 5000);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorVisible = false;

		if (password.length < 8) return flagError('Password must be at least 8 characters');
		if (password !== confirmPassword) return flagError('Passwords do not match');
		if (!token) return showToast('Missing reset token', 'error');

		loading = true;
		try {
			const res = await authClient.resetPassword({ newPassword: password, token });
			if (res.error) throw new Error(res.error.message);

			showToast(successMessage, 'success');
			await goto(redirectTo);
		} catch (e) {
			console.error(e instanceof Error && e.message);
			flagError(e instanceof Error ? e.message : 'Failed to set password');
		} finally {
			loading = false;
		}
	}
</script>

<section class="mt-10 flex flex-col items-center justify-center gap-10">
	{#if linkError === 'INVALID_TOKEN'}
		<div class="flex w-fit flex-col items-center gap-4 rounded-xl bg-base-200 p-5 shadow-xl">
			<div class="text-2xl">Link expired</div>
			<p class="max-w-xs text-center text-base-content/70">{expiredMessage}</p>
		</div>
	{:else if !token}
		<div class="flex w-fit flex-col items-center gap-4 rounded-xl bg-base-200 p-5 shadow-xl">
			<div class="text-2xl">Invalid link</div>
			<p class="max-w-xs text-center text-base-content/70">{missingTokenMessage}</p>
		</div>
	{:else}
		<form
			class="flex w-fit flex-col items-center justify-center gap-8 rounded-xl bg-base-200 p-5 shadow-xl"
			onsubmit={handleSubmit}
		>
			<div class="flex flex-col items-center gap-1">
				<div class="text-2xl">{title}</div>
				{#if subtitle}
					<p class="text-sm text-base-content/70">{subtitle}</p>
				{/if}
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

			<button class="btn btn-primary" disabled={loading}>
				{#if loading}
					<span class="loading loading-spinner"></span>
				{/if}
				{submitLabel}
			</button>
		</form>
	{/if}
</section>
