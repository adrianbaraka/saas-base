<script lang="ts">
	import MailOutlineIcon from '@iconify-svelte/material-symbols/mail-outline';
	import PersonOutlineIcon from '@iconify-svelte/material-symbols/person-outline';
	import BusinessOutlineIcon from '@iconify-svelte/material-symbols/business-center-outline';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { submitJson } from '#lib/utils.ts';

	let loading = $state(false);
	let errorVisible = $state(false);

	let requesterName = $state('');
	let email = $state('');
	let organizationName = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		loading = true;
		errorVisible = false;

		try {
			const result = await submitJson('/api/v1/org-requests', {
				email,
				organizationName,
				requesterName
			});

			if (!result.ok) {
				showToast(result.error, 'error');
				errorVisible = true;
				setTimeout(() => (errorVisible = false), 5000);
				return;
			}

			showToast('Request submitted. We will be in touch shortly.', 'success');
			email = '';
			organizationName = '';
			requesterName = '';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Apply | APP_DISPLAY_NAME</title>
</svelte:head>

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
				bind:value={requesterName}
			/>
		</label>

		<!-- email -->
		<label class="validator input" class:input-error={errorVisible}>
			<MailOutlineIcon height="20" />
			<input type="email" required placeholder="Email" minlength="3" bind:value={email} />
		</label>

		<!-- tenant/company name -->
		<label class="validator input" class:input-error={errorVisible}>
			<BusinessOutlineIcon height="20" />
			<input
				type="text"
				required
				placeholder="Company name"
				minlength="3"
				bind:value={organizationName}
			/>
		</label>

		<!-- submit -->
		<button class="btn btn-primary" disabled={loading}>
			{#if loading}
				<span class="loading loading-spinner"></span>
			{/if}
			Submit Request
		</button>
	</form>
</section>
