<script lang="ts">
	import DashboardIcon from '@iconify-svelte/material-symbols/dashboard';
	import GroupsIcon from '@iconify-svelte/material-symbols/groups';
	import ListIcon from '@iconify-svelte/material-symbols/list';
	import PersonIcon from '@iconify-svelte/material-symbols/person';
	import SettingsIcon from '@iconify-svelte/material-symbols/settings';
	import PersonAddIcon from '@iconify-svelte/material-symbols/person-add';
	import Sidebar from '#lib/components/Layout/Sidebar.svelte';
	import type { SideLink } from '#lib';

	const links: SideLink[] = [
		{ href: '/admin/dashboard', name: 'Dashboard', icon: DashboardIcon },
		{
			name: 'Users',
			icon: GroupsIcon,
			children: [
				{ href: '/admin/users', name: 'All Users', icon: ListIcon },
				{ href: '/admin/users/create', name: 'New User', icon: PersonAddIcon },
				{ href: '/admin/users/roles', name: 'Roles', icon: PersonIcon }
			]
		},
		{ name: 'Settings', icon: SettingsIcon, href: '/admin/settings' }
	];
	let { children } = $props();
</script>

<Sidebar {links}>
	{@render children()}
</Sidebar>
