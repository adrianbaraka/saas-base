<script lang="ts">
	import ActivityFeed from '#lib/components/activityFeed.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<ActivityFeed {data} title="Activity" />
