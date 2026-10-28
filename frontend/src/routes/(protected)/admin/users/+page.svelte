<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import Pagination from '#lib/components/Table/Pagination.svelte';
	import SortableHeader from '#lib/components/Table/SortableHeader.svelte';
	import type { PageProps } from './$types';
	import SearchIcon from '@iconify-svelte/material-symbols/search';
	import CheckIcon from '@iconify-svelte/material-symbols/check';
	import StatCard from '#lib/components/StatCard.svelte';
	import GroupIcon from '@iconify-svelte/material-symbols/group';
	import BlockIcon from '@iconify-svelte/material-symbols/block';
	import MarkEmailUnreadIcon from '@iconify-svelte/material-symbols/mark-email-unread';
	import AdminPanelSettingsIcon from '@iconify-svelte/material-symbols/admin-panel-settings';
	import { isEffectivelyBanned } from '#lib/utils.js';
	import { TableUrlState } from '#lib/components/Table/tableUrlState.svelte.js';

	let { data }: PageProps = $props();

	const table = $derived(new TableUrlState(data));

	$effect(() => {
		table.sync(data);
	});

	const totalPages = $derived(Math.ceil(data.total / table.limit));
	const currentPage = $derived(Math.floor(data.offset / table.limit) + 1);

	// prettier-ignore
	function stats() {
		return [
			{ title: 'Total Users', value: `${data.stats.totalUsers}`, desc: 'Registered accounts', color: '', Icon: GroupIcon },
			{ title: 'Admin Users', value: `${data.stats.adminUsers}`, desc: 'Assigned admin role', color: 'text-success', Icon: AdminPanelSettingsIcon },
			{ title: 'Unverified Users', value: `${data.stats.unverifiedUsers}`, desc: 'Email not verified', color: 'text-warning', Icon: MarkEmailUnreadIcon },
			{ title: 'Banned Users', value: `${data.stats.bannedUsers}`, desc: 'Currently banned', color: 'text-red-700', Icon: BlockIcon }
		];
	}
</script>

<Appbar
	user={data.me}
	title="Manage Users"
	description="View and Manage all users in the organisation."
>
	<div class="flex flex-wrap pb-5 gap-10 items-center justify-center">
		{#each stats() as stat}
			<StatCard
				title={stat.title}
				value={stat.value}
				desc={stat.desc}
				color={stat.color}
				Icon={stat.Icon}
			/>
		{/each}
	</div>

	<div>
		<h2 class="text-2xl font-bold mb-5">Users</h2>

		<div class="flex flex-col gap-4">
			<div class="flex justify-end">
				<label class="input input-bordered">
					<input placeholder="Search by name/email..." bind:value={table.search} class="grow" />
					<SearchIcon height="16" class="opacity-60" />
				</label>
			</div>

			<div class="flex items-center gap-2">
				<label for="items" class="text-sm">Items per page:</label>
				<select
					id="items"
					class="select select-bordered w-16 select-sm"
					bind:value={table.limit}
					onchange={() => table.changeLimit(table.limit)}
				>
					<option value={5}>5</option>
					<option value={20}>20</option>
					<option value={50}>50</option>
					<option value={100}>100</option>
				</select>
			</div>

			<div class="overflow-x-auto">
				<table class="table table-zebra table-pin-rows">
					<thead>
						<tr>
							<SortableHeader column="name" {table}>Name</SortableHeader>
							<SortableHeader column="email" {table}>Email</SortableHeader>
							<SortableHeader column="emailVerified" {table}>Email Status</SortableHeader>
							<SortableHeader column="role" {table}>Role</SortableHeader>
							<SortableHeader column="createdAt" {table}>Created</SortableHeader>
							<SortableHeader column="banned" {table}>Account Status</SortableHeader>
						</tr>
					</thead>
					<tbody>
						{#each data.users as user}
							<tr class="hover:bg-base-300">
								<td class="p-0"
									><a href={`/admin/users/${user.id}`} class="flex px-4 py-2">{user.name}</a></td
								>
								<td class="p-0"
									><a href={`/admin/users/${user.id}`} class="flex px-4 py-2">{user.email}</a></td
								>
								<td class="p-0">
									<a href={`/admin/users/${user.id}`} class="flex px-4 py-2">
										{#if user.emailVerified}
											<span class="badge text-blue-800 dark:badge-primary badge-soft badge-sm">
												<CheckIcon height="16" />Verified
											</span>
										{:else}
											<span class="badge badge-warning badge-soft badge-sm">Unverified</span>
										{/if}
									</a>
								</td>
								<td class="p-0">
									<a href={`/admin/users/${user.id}`} class="flex px-4 py-2">
										<span class="badge badge-ghost">{user.role ?? 'user'}</span>
									</a>
								</td>
								<td class="p-0">
									<a href={`/admin/users/${user.id}`} class="flex px-4 py-2">
										{new Date(user.createdAt).toLocaleDateString()}
									</a>
								</td>
								<td class="p-0">
									<a href={`/admin/users/${user.id}`} class="flex px-4 py-2">
										{#if isEffectivelyBanned(user.banned, user.banExpires)}
											<span class="badge badge-error badge-soft badge-sm">Banned</span>
										{:else}
											<span class="badge badge-success badge-sm badge-soft">Active</span>
										{/if}
									</a>
								</td>
							</tr>
						{:else}
							<tr><td colspan={6} class="text-center py-6">No users found.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="flex items-center gap-4">
				<Pagination {currentPage} {totalPages} onPageChange={(p) => table.goToPage(p)} />
				<span class="text-sm text-gray-500">
					{data.offset + 1}–{Math.min(data.offset + table.limit, data.total)} of {data.total} users
				</span>
			</div>
		</div>
	</div>
</Appbar>
