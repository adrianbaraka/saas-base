<script lang="ts">
	import SchoolIcon from '@iconify-svelte/material-symbols/school';
	import MenuIcon from '@iconify-svelte/material-symbols/menu';
	import ChevronDownIcon from '@iconify-svelte/material-symbols/keyboard-arrow-down';
	import { page } from '$app/state';
	import type { IconComponent, SideLink } from '$lib';
	import { isSidebarOpen, closeSidebar, toggleSidebar } from './sidebarStore.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		links: SideLink[];
		children: Snippet;
		logo?: IconComponent;
		appName?: string;
	}

	let { links, children, logo: Logo = SchoolIcon, appName = 'Name' }: Props = $props();

	// desktop: icon-only collapse (independent of mobile drawer)
	let collapsed = $state(false);

	const current = $derived(page.url.pathname);
	let openGroups = $state<Record<string, boolean>>({});

	function toggleGroup(name: string) {
		openGroups[name] = !openGroups[name];
	}

	function isChildActive(link: SideLink): boolean {
		return !!link.children?.some((c) => c.href === current);
	}
</script>

<div class="flex flex-col lg:flex-row h-screen">
	{#if isSidebarOpen()}
		<button
			class="fixed inset-0 bg-black/50 z-10 lg:hidden"
			onclick={closeSidebar}
			aria-label="Close menu"
		></button>
	{/if}

	<nav
		class={`bg-base-100 lg:bg-primary h-screen fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-300 ease-in-out
			${isSidebarOpen() ? 'translate-x-0' : '-translate-x-full'}
			lg:translate-x-0 lg:sticky lg:top-0 lg:self-start lg:overflow-y-auto lg:w-auto lg:min-w-fit`}
	>
		<div class="flex gap-3 justify-between items-center pt-5 px-5">
			<div class={`${collapsed ? 'block lg:hidden' : ''}`}>
				<Logo height="30" />
			</div>
			<div class={`${collapsed ? 'block lg:hidden' : ''} text-2xl`}>{appName}</div>
			<button
				class="cursor-pointer hover:scale-110"
				onclick={() => {
					collapsed = !collapsed;
					toggleSidebar();
				}}
			>
				<MenuIcon height="25" aria-label="Menu Icon" />
			</button>
		</div>

		<hr class="m-3 mx-10" />

		<ul class="flex flex-col justify-center items-center p-2 cursor-pointer gap-2">
			{#each links as link}
				<li class="w-full">
					{#if link.children?.length}
						<button
							type="button"
							onclick={() => toggleGroup(link.name)}
							class={`hover:bg-blue-500 dark:hover:bg-blue-950 p-3 cursor-pointer w-full rounded-xl flex items-center justify-between gap-4 ${isChildActive(link) ? 'bg-blue-500 dark:bg-blue-950' : ''}`}
						>
							<span class="flex gap-4 items-center">
								<span title={link.name}><link.icon height="20" /></span>
								<span class={collapsed ? 'lg:hidden' : ''}>{link.name}</span>
							</span>
							<span
								class={`${collapsed ? 'lg:hidden' : ''} transition-transform duration-200 ${openGroups[link.name] ? 'rotate-180' : ''}`}
							>
								<ChevronDownIcon height="18" />
							</span>
						</button>

						{#if openGroups[link.name]}
							<ul class="flex flex-col gap-1 pl-10 pr-2 pt-1">
								{#each link.children as child}
									<li
										class={`hover:bg-blue-500 dark:hover:bg-blue-950 hover:underline p-2 rounded-xl ${current === child.href ? 'bg-blue-500 dark:bg-blue-950' : ''}`}
									>
										<a
											href={child.href}
											class="flex gap-3 items-center text-sm"
											onclick={closeSidebar}
										>
											<span title={child.name}><child.icon height="16" /></span>
											<span class={collapsed ? 'lg:hidden' : ''}>{child.name}</span>
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					{:else}
						<a
							href={link.href}
							class={`hover:bg-blue-500 dark:hover:bg-blue-950 hover:underline p-3 w-full rounded-xl flex lg:block ${current === link.href ? 'bg-blue-500 dark:bg-blue-950' : ''}`}
							onclick={closeSidebar}
						>
							<span class="flex gap-4 items-center">
								<span title={link.name}><link.icon height="20" /></span>
								<span class={collapsed ? 'lg:hidden' : ''}>{link.name}</span>
							</span>
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>

	<main class="flex-1 min-w-0 flex flex-col h-full overflow-hidden">{@render children()}</main>
</div>
