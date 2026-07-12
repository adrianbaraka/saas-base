<script lang="ts">
	import MailIcon from '@iconify-svelte/material-symbols/mail';
	import type { BetterAuthUser } from '$lib';
	import { getInviteStatus, welcomeEmailSend } from '$lib/utils';
	import { openModal } from '$lib/components/Modal/modalStore.svelte';

	let { user, me }: { user: BetterAuthUser; me: BetterAuthUser } = $props();

	let sending = $state(false);
	async function sendMail() {
		if (getInviteStatus(user.welcomeEmailSentAt ?? null) === 'pending') {
			const confirmed = await openModal({
				title: 'Invite link still valid.',
				content: ConfirmResending
			});
			if (!confirmed) {
				sending = false;
				return;
			}
		}

		sending = true;
		await welcomeEmailSend({
			email: user.email,
			me
		});
		sending = false;
	}
</script>

{#if !user.emailVerified}
	<button class="btn rounded-2xl flex flex-row gap-2" disabled={sending} onclick={sendMail}>
		<span>Send Welcome Email</span>
		<MailIcon height="24" />
	</button>
{/if}

{#snippet ConfirmResending({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	{#if user.welcomeEmailSentAt}
		<div class="">
			<p class="">
				An invite link was already sent on <em
					>{new Date(user.welcomeEmailSentAt).toDateString()} at {new Date(
						user.welcomeEmailSentAt
					).toLocaleTimeString()}</em
				>
				and is yet to expire.
				<br />
				Send another email?
			</p>
			<div class="modal-action">
				<button class="btn" onclick={cancel}>Cancel</button>
				<button class="btn btn-warning" onclick={confirm}>Resend invite</button>
			</div>
		</div>
	{/if}
{/snippet}
