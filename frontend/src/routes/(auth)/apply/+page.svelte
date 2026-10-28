<script lang="ts">
	//import { goto } from '$app/navigation';

	import KeyOutlineIcon from '@iconify-svelte/material-symbols/key-outline';
	import VisibilityIcon from '@iconify-svelte/material-symbols/visibility';
	import VisibilityOffIcon from '@iconify-svelte/material-symbols/visibility-off';
	import MailOutlineIcon from '@iconify-svelte/material-symbols/mail-outline';
	import PersonOutlineIcon from '@iconify-svelte/material-symbols/person-outline';
	import BusinessOutlineIcon from '@iconify-svelte/material-symbols/business-center-outline';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';

	let passwordVisible = $state(false);
	let confirmPasswordVisible = $state(false);
	let loading = $state(false);
	let errorVisible = $state(false);

	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let orgName = $state('');

	let passwordsMatch = $derived(
		password.length === 0 || confirmPassword.length === 0 || password === confirmPassword
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (password !== confirmPassword) {
			showToast('Passwords do not match', 'error');
			return;
		}

		loading = true;
		errorVisible = false;

		try {
			const res = await fetch('/api/v1/tenants/request-tenancy', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fullName, email, password, orgName })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? 'Unable to process request');
			}

			showToast('Request submitted. We will be in touch shortly.', 'success');
			// TODO a page showing their request status
			//await goto('/apply/submitted');
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Unable to process request', 'error');
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
		<div class="text-2xl">Request Access</div>

		<!-- username -->
		<label class="validator input" class:input-error={errorVisible}>
			<PersonOutlineIcon height="20" />
			<input
				type="text"
				required
				placeholder="Your name"
				minlength="3"
				maxlength="30"
				bind:value={fullName}
			/>
		</label>

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
				minlength="8"
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

		<!-- confirm password -->
		<label class="validator input" class:input-error={!passwordsMatch}>
			<KeyOutlineIcon height="20" />
			<input
				type={confirmPasswordVisible ? 'text' : 'password'}
				required
				placeholder="Confirm password"
				bind:value={confirmPassword}
			/>
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm"
				onclick={() => (confirmPasswordVisible = !confirmPasswordVisible)}
			>
				{#if confirmPasswordVisible}
					<VisibilityOffIcon height="20" />
				{:else}
					<VisibilityIcon height="20" />
				{/if}
			</button>
		</label>
		{#if !passwordsMatch}
			<p class="-mt-6 text-sm text-error">Passwords do not match</p>
		{/if}

		<!-- tenant/company name -->
		<label class="validator input" class:input-error={errorVisible}>
			<BusinessOutlineIcon height="20" />
			<input type="text" required placeholder="Company name" minlength="3" bind:value={orgName} />
		</label>

		<!-- submit -->
		<button class="btn btn-primary" disabled={loading || !passwordsMatch}>
			{#if loading}
				<span class="loading loading-spinner"></span>
			{/if}
			Submit Request
		</button>
	</form>
</section>
