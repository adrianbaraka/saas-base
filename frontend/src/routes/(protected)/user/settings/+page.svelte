<script lang="ts">
	import SettingsPage from '#lib/components/Profile/SettingsPage.svelte';
	let { data } = $props();
</script>

{#if data.mySession}
	<SettingsPage
		me={data.mySession?.user}
		mySession={data.mySession.session}
		sessions={data.allMySessions}
	/>
{/if}
