<script lang="ts">
	import { goto } from '$app/navigation';
	import type { BetterAuthUser } from '$lib';
	import { authClient } from '$lib/auth-client';
	import type { Snippet } from 'svelte';
	import { rolePrefix } from '$lib/roles';
	import MenuIcon from '@iconify-svelte/material-symbols/menu';
	import { showToast } from '../Toast/toastStore.svelte';
	import { toggleSidebar } from './sidebarStore.svelte';

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

	// TODO settings will have tabs go to right tab here
	const settingsURL = $derived(rolePrefix(user?.role) + '/settings');
	const profileURL = $derived(rolePrefix(user?.role) + '/settings');

	async function logout() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					goto('/login');
				},
				onError(context) {
					showToast('An Error Occurred. Try again later.', 'error');
					console.error(context.error);
				}
			}
		});
	}
</script>

<div class="flex h-full flex-col">
	<header class="navbar sticky top-0 z-10 shadow-xl rounded-xl gap-2 lg:bg-base-100 lg:shadow-2xl bg-primary">
		<div class="flex-none lg:hidden">
			<button class="btn btn-ghost btn-circle" onclick={toggleSidebar} aria-label="Toggle menu">
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
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
					{#if user?.image}
						<div class="w-10 rounded-full">
							<img alt={user.name ?? 'User avatar'} src={user.image} />
						</div>
					{:else}
						<div class="avatar avatar-placeholder">
							<div class="bg-neutral text-neutral-content w-8 rounded-full">
								<span class="text-xs"
									>{user?.name ? user.name.slice(0, 2).toUpperCase() : 'UI'}</span
								>
							</div>
						</div>
					{/if}
				</div>
				<ul
					tabindex="-1"
					class="menu lg:menu-sm dropdown-content bg-base-300 rounded-box z-1 mt-3 w-52 p-2 shadow"
				>
					<li class="max-w-full min-w-0 px-3 *:hover:bg-transparent *:hover:cursor-text">
						<div class="flex justify-center w-full truncate font-medium" title={user?.name}>
							{user?.name}
						</div>
						<div class="flex justify-center w-full truncate" title={user?.email}>
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
