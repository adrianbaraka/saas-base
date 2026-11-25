<script lang="ts">
	import SetPasswordForm from '#lib/components/setPasswordForm.svelte';
</script>

<svelte:head>
	<title>Welcome | APP_DISPLAY_NAME</title>
</svelte:head>
<SetPasswordForm
	title="Welcome to APP_DISPLAY_NAME"
	subtitle="First, set your password to finish setup"
	submitLabel="Set password"
	successMessage="Password set. You can log in now"
	redirectTo="/login?setup=success"
	expiredMessage="This invite link is invalid or has expired. Ask an admin to send you a new one."
	missingTokenMessage="This link is missing a token. Please use the link from your invite email."
/>
