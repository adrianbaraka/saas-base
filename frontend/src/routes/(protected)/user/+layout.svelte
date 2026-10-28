<script lang="ts">
	import type { SideLink } from '#lib';
	import Sidebar from '#lib/components/Layout/Sidebar.svelte';
	import DashboardIcon from '@iconify-svelte/material-symbols/dashboard';
	import SettingsIcon from '@iconify-svelte/material-symbols/settings';

	const links: SideLink[] = [
		{ href: '/user/dashboard', name: 'Dashboard', icon: DashboardIcon },
		{ name: 'Settings', icon: SettingsIcon, href: '/user/settings' }
	];
	let { children } = $props();
</script>

<Sidebar {links}>
	{@render children()}
</Sidebar>
