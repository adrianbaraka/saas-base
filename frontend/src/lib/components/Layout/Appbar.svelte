<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '#lib/auth-client.js';
	import type { Snippet } from 'svelte';
	import MenuIcon from '@iconify-svelte/material-symbols/menu';
	import { showToast } from '../Toast/toastStore.svelte';
	import { toggleSidebar } from './sidebarStore.svelte';
	import { resolve } from '$app/paths';
	import type { BetterAuthUser } from '#lib/interfaces.ts';

	let {
		user,
		title,
		description,
		children
	}: {
		user: BetterAuthUser | undefined | null;
		title: string;
		description: string;
		children: Snippet;
	} = $props();

// TODO settings url
// TODO switch orgs from here basically link to /continue if has more than one org in locals.orgs
	const settingsURL = '/settings';
	const profileURL = '/settings';
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
</script>

<svelte:head>
	<title>{title} | APP_DISPLAY_NAME</title>
</svelte:head>

<div class="flex h-full flex-col">
	<header
		class="navbar sticky top-0 z-10 gap-2 rounded-xl bg-primary shadow-xl lg:bg-base-100 lg:shadow"
	>
		<div class="flex-none lg:hidden">
			<button class="btn btn-circle btn-ghost" onclick={toggleSidebar} aria-label="Toggle menu">
				<MenuIcon height="22" />
			</button>
		</div>
		<div class="flex-1">
			<div class="flex flex-col gap-2">
				<div class="text-xl font-bold">{title}</div>
				<div class="text-sm italic">{description}</div>
			</div>
		</div>
		<div class="flex-none">
			<div class="dropdown dropdown-end" id="appbar">
				<div tabindex="0" role="button" class="btn avatar btn-circle btn-ghost">
					{#if user?.image}
						<div class="w-10 rounded-full">
							<img alt={user.name ?? 'User avatar'} src={user.image} />
						</div>
					{:else}
						<div class="avatar avatar-placeholder">
							<div class="w-8 rounded-full bg-neutral text-neutral-content">
								<span class="text-xs">
									{user?.name ? user.name.slice(0, 2).toUpperCase() : 'UI'}
								</span>
							</div>
						</div>
					{/if}
				</div>
				<ul
					tabindex="-1"
					class="dropdown-content menu z-1 mt-3 w-52 rounded-box bg-base-300 p-2 shadow lg:menu-sm"
				>
					<li class="max-w-full min-w-0 px-3 *:hover:cursor-text *:hover:bg-transparent">
						<div class="flex w-full justify-center truncate font-medium" title={user?.name}>
							{user?.name}
						</div>
						<div class="flex w-full justify-center truncate" title={user?.email}>
							{user?.email}
						</div>
					</li>
					<hr class="my-2" />
					<li>
						<a class="justify-between" href={profileURL}>My Profile</a>
					</li>
					<li><a href={settingsURL}>Settings</a></li>
					<li class="text-error">
						<button onclick={logout}>Logout</button>
					</li>
				</ul>
			</div>
		</div>
	</header>

	<div class="flex-1 overflow-y-auto p-5">
		{@render children()}
	</div>
</div>
