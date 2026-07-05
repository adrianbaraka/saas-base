<script lang="ts">
	import UserProfilePage from '$lib/components/Profile/UserProfilePage.svelte';
	let { data } = $props();
</script>

{#if data.mySession}
	<UserProfilePage
		mySession={data.mySession}
		userToShow={data.mySession.user}
		isProfile
		allSessionsToShow={data.allMySessions}
	/>
{/if}
