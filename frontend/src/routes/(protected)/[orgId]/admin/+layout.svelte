<script lang="ts">
	import DashboardIcon from '@iconify-svelte/material-symbols/dashboard';
	import SettingsIcon from '@iconify-svelte/material-symbols/settings';
	import GroupsIcon from '@iconify-svelte/material-symbols/groups';
	import ListIcon from '@iconify-svelte/material-symbols/list';
	import PersonAddIcon from '@iconify-svelte/material-symbols/person-add';
	import Sidebar from '#lib/components/Layout/Sidebar.svelte';
	import HistoryIcon from '@iconify-svelte/material-symbols/history';
	import type { SideLink } from '#lib/interfaces.ts';
	import { page } from '$app/state';

	let { data, children } = $props();

	// this layout lives under [orgId], so the param is always present
	const base = $derived(`/${encodeURIComponent(page.params.orgId ?? '')}/admin`);

	const links: SideLink[] = $derived([
		{ href: `${base}/dashboard`, name: 'Dashboard', icon: DashboardIcon },
		{
			name: 'Users',
			icon: GroupsIcon,
			children: [
				{ href: `${base}/users`, name: 'All Users', icon: ListIcon },
				{ href: `${base}/users/new`, name: 'Add User', icon: PersonAddIcon }
			]
		},
		{ href: `${base}/activity`, name: 'Activity', icon: HistoryIcon },
		{ href: `${base}/settings`, name: 'Settings', icon: SettingsIcon }
	]);
</script>

<Sidebar {links} appName={data.org.name}>
	{@render children()}
</Sidebar>
