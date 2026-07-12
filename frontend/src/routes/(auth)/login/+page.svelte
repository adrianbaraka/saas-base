<script lang="ts">
	import { goto } from '$app/navigation';

	import KeyOutlineIcon from '@iconify-svelte/material-symbols/key-outline';
	import VisibilityIcon from '@iconify-svelte/material-symbols/visibility';
	import VisibilityOffIcon from '@iconify-svelte/material-symbols/visibility-off';
	import MailOutlineIcon from '@iconify-svelte/material-symbols/mail-outline';
	import { authClient } from '$lib/auth-client';
	import { showToast } from '$lib/components/Toast/toastStore.svelte';
	import { rolePrefix } from '$lib/roles';

	let passwordVisible = $state(false);
	let loading = $state(false);
	let errorVisible = $state(false);
	let email = $state('');
	let password = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		errorVisible = false;

		try {
			const res = await authClient.signIn.email({
				email: email,
				password: password
			});

			if (res.error) {
				throw new Error(res.error.message);
			}
			const userDashboard = `${rolePrefix(res.data.user.role)}/dashboard`;
			await goto(userDashboard);
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Failed to log in', 'error');
			console.error(e instanceof Error && e.message);

			errorVisible = true;
			setTimeout(() => (errorVisible = false), 5000);
		} finally {
			loading = false;
		}
	}
</script>

<section class="mt-10 flex flex-col items-center justify-center gap-10">
	<form
		class="flex w-fit flex-col items-center justify-center gap-8 rounded-xl bg-base-200 p-5 shadow-xl"
		onsubmit={handleSubmit}
	>
		<div class="text-2xl">Welcome Back</div>

		<!-- email -->
		<label class="validator input" class:input-error={errorVisible}>
			<MailOutlineIcon height="20" />
			<input
				type="email"
				required
				placeholder="Email"
				minlength="3"
				maxlength="30"
				bind:value={email}
			/>
		</label>

		<!-- password -->
		<label class="validator input" class:input-error={errorVisible}>
			<KeyOutlineIcon height="20" />
			<input
				type={passwordVisible ? 'text' : 'password'}
				required
				placeholder="Password"
				bind:value={password}
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

		<!-- Submit button -->
		<button class="btn btn-primary" disabled={loading}>
			{#if loading}
				<span class="loading loading-spinner"></span>
			{/if}
			Log In
		</button>
	</form>
</section>
