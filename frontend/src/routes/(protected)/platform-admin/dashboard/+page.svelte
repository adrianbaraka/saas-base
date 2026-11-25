<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import StatCard from '#lib/components/StatCard.svelte';
	import type { PageProps } from './$types';
	import DomainIcon from '@iconify-svelte/material-symbols/domain';
	import GroupIcon from '@iconify-svelte/material-symbols/group';
	import AdminPanelSettingsIcon from '@iconify-svelte/material-symbols/admin-panel-settings';
	import PendingActionsIcon from '@iconify-svelte/material-symbols/pending-actions';
	import PersonOffIcon from '@iconify-svelte/material-symbols/person-off';
	import PendingWork from '#lib/components/pendingWork.svelte';

	let { data }: PageProps = $props();

	// prettier-ignore
	const stats = $derived([
		{ title: 'Organizations', value: `${data.stats.totalOrganizations}`, desc: 'Active tenants', color: '', Icon: DomainIcon, href: '/platform-admin/tenants' },
		{ title: 'Total Users', value: `${data.stats.totalUsers}`, desc: 'Excluding accounts with no organization', color: '', Icon: GroupIcon, href: '/platform-admin/users' },
		{ title: 'Platform Admins', value: `${data.stats.totalPlatformAdmins}`, desc: 'Can manage the platform', color: 'text-success', Icon: AdminPanelSettingsIcon, href: '/platform-admin/users' },
		{ title: 'Pending Requests', value: `${data.stats.pendingRequests}`, desc: 'Awaiting review', color: data.stats.pendingRequests > 0 ? 'text-warning' : '', Icon: PendingActionsIcon, href: '/platform-admin/requests' },
		{ title: 'Limbo Accounts', value: `${data.stats.limboAccounts}`, desc: 'Users with no organization', color: data.stats.limboAccounts > 0 ? 'text-warning' : '', Icon: PersonOffIcon, href: '/platform-admin/users' }
	]);
</script>

<Appbar user={data.me} title="Dashboard" description="Platform overview.">
	<div class="mx-auto flex max-w-6xl flex-col gap-8 pb-5">
		<!-- 1. Welcome banner -->
		<section class="rounded-box bg-primary px-6 py-5 text-primary-content shadow">
			<h2 class="text-xl font-bold">Welcome back, {data.me?.name}</h2>
			<p class="opacity-80">Here's what's happening across the platform today.</p>
		</section>

		<!-- 2. Stats -->
		<section class="flex flex-wrap items-center justify-center gap-10">
			{#each stats as stat (stat.title)}
				<StatCard
					title={stat.title}
					value={stat.value}
					desc={stat.desc}
					color={stat.color}
					Icon={stat.Icon}
					href={stat.href}
				/>
			{/each}
		</section>

		<!-- 3. Pending work (streamed) -->
		<PendingWork pending={data.pending} />
	</div>
</Appbar>
