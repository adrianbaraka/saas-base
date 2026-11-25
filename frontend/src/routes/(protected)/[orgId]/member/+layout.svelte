<script lang="ts">
	import DashboardIcon from '@iconify-svelte/material-symbols/dashboard';
	import SettingsIcon from '@iconify-svelte/material-symbols/settings';
	import Sidebar from '#lib/components/Layout/Sidebar.svelte';
	import type { SideLink } from '#lib/interfaces.ts';
	import { page } from '$app/state';

	let { data, children } = $props();

	// this layout lives under [orgId], so the param is always present
	const base = $derived(`/${encodeURIComponent(page.params.orgId ?? '')}/member`);

	const links: SideLink[] = $derived([
		{ href: `${base}/dashboard`, name: 'Dashboard', icon: DashboardIcon },
		{ href: `${base}/settings`, name: 'Settings', icon: SettingsIcon }
	]);
</script>

<Sidebar {links} appName={data.org.name}>
	{@render children()}
</Sidebar>
