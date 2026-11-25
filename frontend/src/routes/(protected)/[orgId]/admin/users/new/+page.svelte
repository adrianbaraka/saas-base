<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import Section from '#lib/components/Section.svelte';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { textInput } from '#lib/components/formComponents.svelte';
	import { postAction } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// To add a step: append it here, add a snippet, add a branch below,
	// and add its fields to `form`.
	const steps = [{ id: 'details', title: 'Details' }] as const;

	let currentStep = $state(0);
	const isLast = $derived(currentStep === steps.length - 1);

	let form = $state({
		firstName: '',
		middleName: '',
		lastName: '',
		email: '',
		phone: '',
		role: ''
	});
	const fullName = $derived(
		[form.firstName, form.middleName, form.lastName]
			.map((p) => p.trim())
			.filter(Boolean)
			.join(' ')
	);

	const selectedRole = $derived(data.roles.find((r) => r.name === form.role));
	const usersPath = $derived(`/${encodeURIComponent(page.params.orgId ?? '')}/admin/users`);

	let submitting = $state(false);

	function back() {
		currentStep -= 1;
	}

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!isLast) {
			currentStep += 1;
			return;
		}
		await finish();
	}

	async function finish() {
		submitting = true;
		try {
			const phone = form.phone.trim();
			const result = await postAction(
				`/api/v1/organizations/${encodeURIComponent(page.params.orgId ?? '')}/members`,
				{
					body: {
						name: fullName,
						email: form.email.trim(),
						role: form.role,
						...(phone && { phone })
					},
					errorMessage: 'Unable to add member'
				}
			);

			if (!result.ok) {
				showToast(result.error, 'error');
				return; // keep the form filled in
			}

			showToast(`Added ${fullName}`, 'success');
			await goto(usersPath);
		} finally {
			submitting = false;
		}
	}
</script>

<Appbar user={data.me} title="Add Member" description="Add a new member to this organization.">
	{#if steps.length > 1}
		<ul class="steps mb-8 w-full">
			{#each steps as s, i (s.id)}
				<li class="step {currentStep >= i ? 'step-primary' : ''}">{s.title}</li>
			{/each}
		</ul>
	{/if}

	<div class="flex flex-col items-center">
		{#if steps[currentStep].id === 'details'}
			{@render detailsStep()}
		{/if}
	</div>
</Appbar>

<!-- step: details -->
{#snippet detailsStep()}
	<Section title="Details">
		<form onsubmit={onSubmit}>
			<div class="flex flex-wrap gap-4">
				{@render textInput('First Name', form.firstName, (v) => (form.firstName = v), true, {
					maxlength: 40
				})}
				{@render textInput('Middle Name', form.middleName, (v) => (form.middleName = v), false, {
					maxlength: 40
				})}
				{@render textInput('Last Name', form.lastName, (v) => (form.lastName = v), true, {
					maxlength: 40
				})}
				{@render textInput('Email', form.email, (v) => (form.email = v), true, {
					type: 'email',
					maxlength: 254
				})}
				{@render textInput('Phone', form.phone, (v) => (form.phone = v), true, {
					type: 'tel',
					maxlength: 20
				})}

				<fieldset
					class="fieldset max-w-full grow overflow-hidden border-b border-base-200 px-6 py-4 lg:basis-1/3"
				>
					<legend
						class="fieldset-legend text-xs font-medium tracking-widest text-base-content/70 uppercase"
					>
						Role <span class="text-error">*</span>
					</legend>
					<select class="select-bordered select mt-1 w-full" bind:value={form.role} required>
						<option value="" disabled>Select role</option>
						{#each data.roles as r (r.name)}
							<option value={r.name} class="capitalize">{r.name}</option>
						{/each}
					</select>
					{#if selectedRole}
						<p class="mt-1 text-xs text-base-content/60">{selectedRole.description}</p>
					{/if}
				</fieldset>
			</div>

			{@render progressButtons()}
		</form>
	</Section>
{/snippet}

{#snippet progressButtons()}
	<div class="mt-8 flex justify-between">
		{#if currentStep > 0}
			<button class="btn btn-ghost" onclick={back} disabled={submitting} type="button">
				Back
			</button>
		{:else}
			<a class="btn btn-ghost" href={usersPath}>Cancel</a>
		{/if}

		<button class="btn btn-primary" type="submit" disabled={submitting}>
			{#if !isLast}
				Next
			{:else}
				{submitting ? 'Adding…' : 'Add member'}
			{/if}
		</button>
	</div>
{/snippet}
