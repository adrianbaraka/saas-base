<script lang="ts">
	import Appbar from '$lib/components/Layout/Appbar.svelte';
	import Pagination from '$lib/components/Table/Pagination.svelte';
	import SortableHeader from '$lib/components/Table/SortableHeader.svelte';
	import type { PageProps } from './$types';
	import HouseIcon from '@iconify-svelte/material-symbols/house';
	import SearchIcon from '@iconify-svelte/material-symbols/search';
	import StatCard from '$lib/components/StatCard.svelte';
	import GroupIcon from '@iconify-svelte/material-symbols/group';
	import TenancyIcon from '@iconify-svelte/material-symbols/tenancy';
	import PendingActionsIcon from '@iconify-svelte/material-symbols/pending-actions';
	import { TableUrlState } from '$lib/components/Table/tableUrlState.svelte';

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
			{ title: 'Total Tenants', value: `${data.stats.totalTenants}`, desc: 'All tenants in the system', color: 'text-primary', Icon: TenancyIcon },
			{ title: 'New Tenants', value: `${data.stats.newTenantsLast30Days}`, desc: 'In the last 30 days', color: 'text-success', Icon: HouseIcon },
			{ title: 'Pending Requests', value: `${data.stats.pendingRequests}`, desc: 'Tenant requests not reviewed', color: 'text-warning', Icon: PendingActionsIcon }
		]
	}

</script>

<Appbar
	user={data.me}
	title="Manage Tenants"
	description="View and Manage all tenants in the organisation."
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
		<h2 class="text-2xl font-bold mb-5">Tenants</h2>

		<div class="flex flex-col gap-4">
			<div class="flex justify-end">
				<label class="input input-bordered">
					<input placeholder="Search by name..." bind:value={table.search} class="grow" />
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
							<th></th>
							<SortableHeader column={'name'} {table}>Name</SortableHeader>
							<SortableHeader column="createdAt" {table}>Created</SortableHeader>
							<SortableHeader column="updatedAt" {table}>Updated</SortableHeader>
						</tr>
					</thead>
					<tbody>
						{#each data.tenants as tenant, index}
							<tr class="hover:bg-base-300">
								<td>{index + 1}</td>
								<td class="p-0">
									<a href={``} class="flex px-4 py-2">
										{tenant.name}
									</a>
								</td>
								<td class="p-0">
									<a href={``} class="flex px-4 py-2">
										{new Date(tenant.createdAt).toLocaleDateString()}
									</a>
								</td>
								<td class="p-0">
									<a href={``} class="flex px-4 py-2">
										{new Date(tenant.updatedAt).toLocaleDateString()}
									</a>
								</td>
							</tr>
						{:else}
							<tr><td colspan={4} class="text-center py-6">No tenants found.</td></tr>
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
