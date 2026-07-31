<script lang="ts">
	import DashboardIcon from '@iconify-svelte/material-symbols/dashboard';
	import SettingsIcon from '@iconify-svelte/material-symbols/settings';
	import AddBusinessIcon from '@iconify-svelte/material-symbols/add-business';
	import Sidebar from '$lib/components/Layout/Sidebar.svelte';
	import PersonIcon from '@iconify-svelte/material-symbols/person';
	import type { SideLink } from '$lib';

	const links: SideLink[] = [
		{ href: '/platform-admin/dashboard', name: 'Dashboard', icon: DashboardIcon },
		{ href: '/platform-admin/requests', name: 'Requests', icon: AddBusinessIcon },
		{ href: '/platform-admin/roles', name: 'Roles', icon: PersonIcon },
		{ href: '/platform-admin/settings', name: 'Settings', icon: SettingsIcon },
	];
	let { children } = $props();
</script>

<Sidebar {links}>
	{@render children()}
</Sidebar>
