<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import BlockIcon from '@iconify-svelte/material-symbols/block';
	import SearchOffIcon from '@iconify-svelte/material-symbols/search-off';
	import ErrorOutlineIcon from '@iconify-svelte/material-symbols/error-outline';
	import WifiOffIcon from '@iconify-svelte/material-symbols/wifi-off';
	import LockOutlineIcon from '@iconify-svelte/material-symbols/lock-outline';
	import LogoutIcon from '@iconify-svelte/material-symbols/logout';
	import { authClient } from '#lib/auth-client.js';
	import { showToast } from './Toast/toastStore.svelte';

	async function logout() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					goto(resolve('login'));
				},
				onError(context) {
					showToast('An Error Occurred. Try again later.', 'error');
					console.error(context.error);
				}
			}
		});
	}

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Something went wrong.');

	const config = $derived.by(() => {
		switch (status) {
			case 401:
				return {
					icon: LockOutlineIcon,
					title: 'Sign in required',
					label: 'Go to login',
					href: `${resolve('login')}?reauth=1` as const
				};
			case 403:
				return { icon: BlockIcon, title: 'Not authorized', label: 'Go back', href: null };
			case 404:
				return {
					icon: SearchOffIcon,
					title: 'Page not found',
					label: 'Go home',
					href: resolve('/(indexable)')
				};
			case 503:
				return { icon: WifiOffIcon, title: 'Service unavailable', label: 'Try again', href: null };
			default:
				return {
					icon: ErrorOutlineIcon,
					title: 'Something went wrong',
					label: 'Go home',
					href: resolve('/(indexable)')
				};
		}
	});

	function handleAction() {
		if (status === 503) location.reload();
		else history.back();
	}
</script>

<div class="flex min-h-screen flex-col">
	<header class="navbar gap-2 bg-base-100 px-4 shadow">
		<div class="flex-1 text-lg font-bold">APP_DISPLAY_NAME</div>
		<div class="flex-none">
			<button class="btn btn-ghost text-error btn-sm" onclick={logout}>
				<LogoutIcon height="18" />
				Logout
			</button>
		</div>
	</header>

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
			{#if config.href}
				<a class="btn btn-primary" href={config.href} data-sveltekit-reload>
					{config.label}
				</a>
			{:else}
				<button class="btn btn-primary" onclick={handleAction}>{config.label}</button>
			{/if}
		</div>
	</section>
</div>
