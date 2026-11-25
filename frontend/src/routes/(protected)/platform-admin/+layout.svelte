<script lang="ts">
	import DashboardIcon from '@iconify-svelte/material-symbols/dashboard';
	import SettingsIcon from '@iconify-svelte/material-symbols/settings';
	import AddBusinessIcon from '@iconify-svelte/material-symbols/add-business';
	import DomainIcon from '@iconify-svelte/material-symbols/domain';
	import GroupsIcon from '@iconify-svelte/material-symbols/groups';
	import ListIcon from '@iconify-svelte/material-symbols/list';
	import Sidebar from '#lib/components/Layout/Sidebar.svelte';
	import HistoryIcon from '@iconify-svelte/material-symbols/history';
	import type { SideLink } from '#lib/interfaces.ts';

	const links: SideLink[] = [
		{ href: '/platform-admin/dashboard', name: 'Dashboard', icon: DashboardIcon },
		{ href: '/platform-admin/tenants', name: 'Tenants', icon: DomainIcon },
		{ href: '/platform-admin/requests', name: 'Requests', icon: AddBusinessIcon },
		{
			name: 'Users',
			icon: GroupsIcon,
			children: [{ href: '/platform-admin/users', name: 'All Users', icon: ListIcon }]
		},
		{ href: '/platform-admin/activity', name: 'Activity', icon: HistoryIcon },
		{ href: '/platform-admin/settings', name: 'Settings', icon: SettingsIcon }
	];
	const appName = 'APP_DISPLAY_NAME';

	let { children } = $props();
</script>

<Sidebar {links} {appName}>
	{@render children()}
</Sidebar>
