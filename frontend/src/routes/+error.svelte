<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import BlockIcon from '@iconify-svelte/material-symbols/block';
	import SearchOffIcon from '@iconify-svelte/material-symbols/search-off';
	import ErrorOutlineIcon from '@iconify-svelte/material-symbols/error-outline';
	import WifiOffIcon from '@iconify-svelte/material-symbols/wifi-off';
	import LockOutlineIcon from '@iconify-svelte/material-symbols/lock-outline';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Something went wrong.');

	const config = $derived.by(() => {
		switch (status) {
			case 401:
				return {
					icon: LockOutlineIcon,
					title: 'Sign in required',
					action: { label: 'Go to login', href: '/login' }
				};
			case 403:
				return {
					icon: BlockIcon,
					title: 'Not authorized',
					action: { label: 'Go back', href: null }
				};
			case 404:
				return {
					icon: SearchOffIcon,
					title: 'Page not found',
					action: { label: 'Go home', href: '/' }
				};
			case 503:
				return {
					icon: WifiOffIcon,
					title: 'Service unavailable',
					action: { label: 'Try again', href: null }
				};
			default:
				return {
					icon: ErrorOutlineIcon,
					title: 'Something went wrong',
					action: { label: 'Go home', href: '/' }
				};
		}
	});

	async function handleAction() {
		if (config.action.href) {
			await goto(config.action.href);
		} else if (status === 503) {
			location.reload();
		} else {
			history.back();
		}
	}
</script>

<section class="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
	<div class="rounded-full bg-base-200 p-6 text-error">
		<config.icon height="48" />
	</div>

	<div class="flex flex-col gap-2">
		<div class="text-sm font-medium tracking-wide text-base-content/50">Error {status}</div>
		<h1 class="text-2xl font-bold">{config.title}</h1>
		<p class="max-w-md text-base-content/70">{message}</p>
	</div>

	<div class="flex gap-3">
		<button class="btn btn-primary" onclick={handleAction}>
			{config.action.label}
		</button>
	</div>
</section>
