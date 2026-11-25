<script lang="ts">
	import { goto } from '$app/navigation';

	import KeyOutlineIcon from '@iconify-svelte/material-symbols/key-outline';
	import VisibilityIcon from '@iconify-svelte/material-symbols/visibility';
	import VisibilityOffIcon from '@iconify-svelte/material-symbols/visibility-off';
	import MailOutlineIcon from '@iconify-svelte/material-symbols/mail-outline';
	import { authClient } from '#lib/auth-client.js';
	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { page } from '$app/state';
	import { safeRedirect } from '#lib/utils.ts';

	let passwordVisible = $state(false);
	let loading = $state(false);
	let errorVisible = $state(false);
	let email = $state('');
	let password = $state('');
	let rememberMe = $state(true);

	let resetEmail = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		errorVisible = false;

		try {
			const res = await authClient.signIn.email({
				email,
				password,
				rememberMe
			});

			if (res.error) {
				throw new Error(res.error.message);
			}
			const redirectTo = safeRedirect(page.url.searchParams.get('redirectTo'), page.url.origin);
			if (redirectTo) {
				try {
					await goto(redirectTo);
					return;
				} catch (error) {
					console.warn(
						'Login redirect destination could not be resolved; falling back to the user dashboard.',
						error
					);
				}
			}
			await goto('/continue');
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Failed to log in', 'error');
			console.error(e instanceof Error && e.message);

			errorVisible = true;
			setTimeout(() => (errorVisible = false), 5000);
		} finally {
			loading = false;
		}
	}

	async function handleForgotPassword() {
		resetEmail = email; // prefill from the login form

		const confirmed = await openModal({
			title: 'Reset your password',
			content: forgotPasswordSnippet
		});

		if (!confirmed) {
			resetEmail = '';
			return;
		}

		const target = resetEmail.trim();
		resetEmail = '';
		if (!target) return;

		try {
			const res = await authClient.requestPasswordReset({
				email: target,
				redirectTo: '/reset-password'
			});

			if (res.error) {
				throw new Error(res.error.message);
			}

			// intentionally vague: don't reveal whether the account exists
			showToast(
				`If an account exists for ${target}, a password reset link has been sent.`,
				'success'
			);
			resetEmail = '';
		} catch (err) {
			console.error('requestPasswordReset failed:', err);
			showToast(err instanceof Error ? err.message : 'Could not send reset link', 'error');
		}
	}
</script>

<svelte:head>
	<title>Login | APP_DISPLAY_NAME</title>
</svelte:head>

{#snippet forgotPasswordSnippet({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			confirm();
		}}
	>
		<div class="flex flex-col gap-4 py-4">
			<p class="text-sm">Enter your email and we'll send you a link to reset your password.</p>
			<label class="validator input w-full">
				<MailOutlineIcon height="20" />
				<input type="email" required placeholder="Email" bind:value={resetEmail} />
			</label>
		</div>
		<div class="modal-action">
			<button class="btn" type="button" onclick={cancel}>Cancel</button>
			<button class="btn btn-primary" type="submit">Send reset link</button>
		</div>
	</form>
{/snippet}

<section class="mt-10 flex flex-col items-center justify-center gap-10">
	<form
		class="flex w-fit flex-col items-center justify-center gap-8 rounded-xl bg-base-200 p-5 shadow-xl"
		onsubmit={handleSubmit}
	>
		<div class="text-2xl">Welcome Back</div>

		<!-- email -->
		<label class="validator input" class:input-error={errorVisible}>
			<MailOutlineIcon height="20" />
			<input type="email" required placeholder="Email" bind:value={email} />
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

		<!-- remember me + forgot password -->
		<div class="flex w-full items-center justify-between gap-4">
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" class="checkbox checkbox-sm" bind:checked={rememberMe} />
				Remember me
			</label>
			<button type="button" class="link text-sm link-primary" onclick={handleForgotPassword}>
				Forgot password?
			</button>
		</div>

		<!-- Submit button -->
		<button class="btn btn-primary" disabled={loading}>
			{#if loading}
				<span class="loading loading-spinner"></span>
			{/if}
			Log In
		</button>
	</form>
</section>
