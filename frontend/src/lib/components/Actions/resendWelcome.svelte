<script lang="ts">
	import MailIcon from '@iconify-svelte/material-symbols/mail';
	import { openModal } from '#lib/components/Modal/modalStore.svelte.js';
	import { showToast } from '#lib/components/Toast/toastStore.svelte.js';
	import { submitJson } from '#lib/utils.ts';

	let { email, disabled = false }: { email: string; disabled?: boolean } = $props();

	let sending = $state(false);

	async function resendWelcome() {
		const confirmed = await openModal({
			title: 'Send welcome email?',
			content: ConfirmResend
		});
		if (!confirmed) return;

		sending = true;
		try {
			const result = await submitJson(
				'/api/v1/platform-admin/users/resend-welcome',
				{
					email: email
				},
				{ errorMessage: 'Could not send the welcome email.' }
			);

			if (!result.ok) {
				showToast(result.error, 'error');
				return;
			}

			showToast('Welcome email sent.', 'success');
		} finally {
			sending = false;
		}
	}
</script>

<button
	class="btn btn-square rounded-2xl btn-outline btn-xs"
	disabled={sending || disabled}
	onclick={resendWelcome}
	aria-label="Send welcome email"
	title="Send welcome email"
>
	{#if sending}
		<span class="loading loading-sm loading-spinner"></span>
	{:else}
		<MailIcon height="sm" />
	{/if}
</button>

{#snippet ConfirmResend({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<div>
		<p>
			This will send the set-password email again to <strong>{email}</strong>. Continue?
		</p>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-primary" onclick={confirm}>Send Email</button>
		</div>
	</div>
{/snippet}
