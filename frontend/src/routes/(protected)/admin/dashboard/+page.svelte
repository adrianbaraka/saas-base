<script lang="ts">
	import Appbar from '$lib/components/Appbar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Appbar
	user={data.me}
	title="Dashboard"
	description="An overview of overall system stats."
>
	<div class="">hello dashboard</div>
</Appbar>


