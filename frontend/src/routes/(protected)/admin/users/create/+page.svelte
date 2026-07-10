<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Appbar from '$lib/components/Layout/Appbar.svelte';
	import Section from '$lib/components/Section.svelte';
	import { showToast } from '$lib/components/Toast/toastStore.svelte.js';
	import UserDetailsFields from '$lib/components/UserDetailsFields.svelte';
	import { welcomeEmailSend } from '$lib/utils.js';

	let { data, form } = $props();

	let submitting = $state(false);
	let sendWelcome = $state(false);
</script>

<Appbar title="Create a new user" description="" user={data.me}>
	<div class="items-center justify-center flex gap-5 flex-col lg:flex-row">
		<Section title="New User">
			<form
				method="POST"
				action="?/createUser"
				class="grid grid-cols-1 md:grid-cols-2 gap-4"
				use:enhance={({ formData }) => {
					submitting = true;
					const email = formData.get('email') as string;
					const sendEmail = formData.get('sendEmail') === 'on';
					return async ({ result }) => {
						submitting = false;
						if (result.type === 'redirect') {
							showToast('Successfully created user', 'success');
							if (sendEmail) {
								await welcomeEmailSend({ email: email, me: data.me! });
							}
							goto(result.location);
						} else if (result.type === 'failure') {
							const message =
								typeof result.data?.error === 'string'
									? result.data.error
									: 'Failed to create user';
							showToast(message, 'error');
							await applyAction(result);
						} else {
							await applyAction(result);
						}
					};
				}}
			>
				<fieldset disabled={submitting} class="contents">
					<UserDetailsFields roles={data.roles} />
					<label class="label text-base-content">
						<input
							type="checkbox"
							class="checkbox"
							name="sendEmail"
							id="sendEmail"
							bind:checked={sendWelcome}
						/>
						Send Welcome Email
					</label>
				</fieldset>
				{#if form?.error}
					<p class="text-error md:col-span-2">{form.error}</p>
				{/if}
				<div class="md:col-span-2 flex justify-end">
					<button type="submit" class="btn btn-primary" disabled={submitting}>
						{#if submitting}
							<span class="loading loading-spinner loading-sm"></span>
							Creating...
						{:else}
							Submit
						{/if}
					</button>
				</div>
			</form>
		</Section>

		<Section title="How it works" vertical>
			<div class="flex flex-col gap-4 p-1 text-sm">
				<div class="flex gap-3">
					<div class="badge badge-success badge-sm mt-0.5 shrink-0">✓</div>
					<p class="">
						<span class="font-semibold">Send Welcome Email checked</span>
						<span class="font-serif tracking-wide">
							<br />The user receives an email with a setup link.
							<br />Clicking it lets them set their own password, after which their account is
							verified and they can log in.
						</span>
					</p>
				</div>

				<div class="flex gap-3">
					<div class="badge badge-warning badge-sm mt-0.5 shrink-0">!</div>
					<p>
						<span class="font-semibold">Send Welcome Email unchecked</span>
						<span class="font-serif tracking-wide">
							<br />The account is created immediately, but the user cannot log in until a password
							is set.
						</span>
					</p>
				</div>

				<div class="divider my-0"></div>

				<p class="text-base-content/70 italic">
					A welcome email can be sent later at any time from this user's profile page if it wasn't
					sent during creation.
				</p>
			</div>
		</Section>
	</div>
</Appbar>
