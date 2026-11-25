<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import StatCard from '#lib/components/StatCard.svelte';
	import PendingWork from '#lib/components/pendingWork.svelte';
	import GroupIcon from '@iconify-svelte/material-symbols/group';
	import AdminPanelSettingsIcon from '@iconify-svelte/material-symbols/admin-panel-settings';
	import MarkEmailUnreadIcon from '@iconify-svelte/material-symbols/mark-email-unread';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const usersPath = $derived(`/${encodeURIComponent(page.params.orgId ?? '')}/admin/users`);

	// prettier-ignore
	const stats = $derived([
		{ title: 'Members', value: `${data.stats.totalUsers}`, desc: 'In this organization', color: '', Icon: GroupIcon, href: usersPath },
		{ title: 'Admins', value: `${data.stats.adminUsers}`, desc: 'Can manage the organization', color: 'text-success', Icon: AdminPanelSettingsIcon, href: `${usersPath}?role=admin` },
		{ title: 'Unverified', value: `${data.stats.unverifiedUsers}`, desc: 'Email not verified yet', color: data.stats.unverifiedUsers > 0 ? 'text-warning' : '', Icon: MarkEmailUnreadIcon, href: `${usersPath}?emailVerified=false` }
	]);
</script>

<Appbar user={data.me} title="Dashboard" description="Organization overview.">
	<div class="mx-auto flex max-w-6xl flex-col gap-8 pb-5">
		<!-- 1. Welcome banner -->
		<section class="rounded-box bg-primary px-6 py-5 text-primary-content shadow">
			<h2 class="text-xl font-bold">Welcome back, {data.me?.name}</h2>
			<p class="opacity-80">Here's what's happening in your organization today.</p>
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
