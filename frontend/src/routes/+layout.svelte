<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import ToastList from '#lib/components/Toast/ToastList.svelte';
	import Modal from '#lib/components/Modal/Modal.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<ToastList />
<Modal />
