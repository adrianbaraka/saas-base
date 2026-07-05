<script lang="ts">
	import MainLayout, { type SideLink } from '$lib/components/MainLayout.svelte';
	import DashboardIcon from '@iconify-svelte/material-symbols/dashboard';
	import GroupsIcon from '@iconify-svelte/material-symbols/groups';
	import ListIcon from '@iconify-svelte/material-symbols/list';
	import PersonIcon from '@iconify-svelte/material-symbols/person';
	import SettingsIcon from '@iconify-svelte/material-symbols/settings';

	const links: SideLink[] = [
		{ href: '/admin/dashboard', name: 'Dashboard', icon: DashboardIcon },
		{
			name: 'Users',
			icon: GroupsIcon,
			children: [
				{ href: '/admin/users', name: 'All Users', icon: ListIcon },
				{ href: '/admin/users/roles', name: 'Roles', icon: PersonIcon }
			]
		},
		{ name: 'Settings', icon: SettingsIcon, href: '/admin/settings' }
	];
	let { children } = $props();
</script>

<MainLayout {links}>
	{@render children()}
</MainLayout>
