<script lang="ts">
	import SetPasswordForm from '#lib/components/setPasswordForm.svelte';
</script>

<svelte:head>
	<title>Reset Password | APP_DISPLAY_NAME</title>
</svelte:head>

<SetPasswordForm
	title="Reset your password"
	subtitle="Choose a new password for your account"
	submitLabel="Reset password"
	successMessage="Password reset. You can log in now"
	redirectTo="/login?reset=success"
	expiredMessage="This reset link is invalid or has expired. Request a new one from the login page."
	missingTokenMessage="This link is missing a token. Please use the link from your reset email."
/>
