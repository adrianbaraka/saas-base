<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';

	let { data } = $props();
</script>

<Appbar title="Default User page" description="" user={data.me}>
	<div>User page for non admin</div>
</Appbar>
