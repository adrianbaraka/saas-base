<script lang="ts">
	import Modal from '#lib/components/Modal/Modal.svelte';
	import ToastList from '#lib/components/Toast/ToastList.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{@render children()}

<ToastList />
<Modal />
