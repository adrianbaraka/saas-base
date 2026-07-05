<script lang="ts">
	import type { PageProps } from './$types';
	import UserProfilePage from '$lib/components/Profile/UserProfilePage.svelte';

	let { data }: PageProps = $props();
	let sessions = $derived(data.sessionData?.sessions);
</script>

{#if data.me}
	<UserProfilePage
		mySession={data.me}
		userToShow={data.user}
		isProfile={false}
		allSessionsToShow={sessions}
		roles={data.rolesData}
	/>
{/if}
