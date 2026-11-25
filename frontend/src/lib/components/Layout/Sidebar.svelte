<script lang="ts">
	import SchoolIcon from '@iconify-svelte/material-symbols/school';
	import MenuIcon from '@iconify-svelte/material-symbols/menu';
	import ChevronDownIcon from '@iconify-svelte/material-symbols/keyboard-arrow-down';
	import { page } from '$app/state';
	import { isSidebarOpen, closeSidebar, toggleSidebar } from './sidebarStore.svelte';
	import type { Snippet } from 'svelte';
	import { version } from '$app/env';
	import type { IconComponent, SideLink } from '#lib/interfaces.ts';

	interface Props {
		links: SideLink[];
		children: Snippet;
		logo?: IconComponent;
		appName?: string;
	}

	let { links, children, appName, logo: Logo = SchoolIcon }: Props = $props();

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

<div class="flex h-dvh flex-col lg:flex-row">
	{#if isSidebarOpen()}
		<button
			class="fixed inset-0 z-10 bg-black/50 lg:hidden"
			onclick={closeSidebar}
			aria-label="Close menu"
		></button>
	{/if}

	<nav
		class={`fixed inset-y-0 left-0 z-20 flex h-dvh w-64 max-w-64 transform flex-col bg-base-100 transition-transform duration-300 ease-in-out lg:bg-primary
		${isSidebarOpen() ? 'translate-x-0' : '-translate-x-full'}
		overflow-y-auto lg:sticky lg:top-0 lg:w-auto lg:min-w-fit lg:translate-x-0 lg:self-start`}
	>
		<div class="sticky top-0 z-5 bg-base-100 lg:bg-primary">
			<div class="flex items-center justify-between gap-3 px-5 pt-5">
				<div class={`${collapsed ? 'block lg:hidden' : ''}`}>
					<Logo height="30" />
				</div>
				<div class={`${collapsed ? 'block lg:hidden' : ''} w-25 truncate text-2xl`} title={appName}>
					{appName}
				</div>
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
		</div>

		<ul class="flex cursor-pointer flex-col items-center justify-center gap-2 p-2 pb-10">
			{#each links as link (link.name)}
				<li class="w-full">
					{#if link.children?.length}
						<button
							type="button"
							onclick={() => toggleGroup(link.name)}
							class={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl p-3 hover:bg-blue-500 dark:hover:bg-blue-950 ${isChildActive(link) ? 'bg-blue-500 dark:bg-blue-950' : ''}`}
						>
							<span class="flex items-center gap-4">
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
							<ul class="flex flex-col gap-1 pt-1 pr-2 pl-10">
								{#each link.children as child (child.name)}
									<li
										class={`rounded-xl p-2 hover:bg-blue-500 hover:underline dark:hover:bg-blue-950 ${current === child.href ? 'bg-blue-500 dark:bg-blue-950' : ''}`}
									>
										<a
											href={child.href}
											class="flex items-center gap-3 text-sm"
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
							class={`flex w-full rounded-xl p-3 hover:bg-blue-500 hover:underline lg:block dark:hover:bg-blue-950 ${current === link.href ? 'bg-blue-500 dark:bg-blue-950' : ''}`}
							onclick={closeSidebar}
						>
							<span class="flex items-center gap-4">
								<span title={link.name}><link.icon height="20" /></span>
								<span class={collapsed ? 'lg:hidden' : ''}>{link.name}</span>
							</span>
						</a>
					{/if}
				</li>
			{/each}
		</ul>
		<div class={`mt-auto px-5 pb-4 text-center text-xs opacity-60 ${collapsed ? 'lg:hidden' : ''}`}>
			<span title={version}>Version {version.slice(0, 7)}</span>
		</div>
	</nav>

	<main class="flex h-full min-w-0 flex-1 flex-col overflow-hidden">{@render children()}</main>
</div>
