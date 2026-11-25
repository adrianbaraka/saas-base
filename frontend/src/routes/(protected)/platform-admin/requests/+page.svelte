<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import Pagination from '#lib/components/Table/Pagination.svelte';
	import SortableHeader from '#lib/components/Table/SortableHeader.svelte';
	import type { PageProps } from './$types';
	import SearchIcon from '@iconify-svelte/material-symbols/search';
	import { TableUrlState } from '#lib/components/Table/tableUrlState.svelte.js';
	import AcceptTenancy from '#lib/components/Actions/acceptTenancy.svelte';
	import RejectTenancy from '#lib/components/Actions/rejectTenancy.svelte';

	let { data }: PageProps = $props();

	const table = $derived(new TableUrlState(data));

	$effect(() => {
		table.sync(data);
	});

	const totalPages = $derived(Math.ceil(data.total / table.limit));
	const currentPage = $derived(Math.floor(data.offset / table.limit) + 1);
</script>

<Appbar user={data.me} title="Manage Tenants" description="">
	<div>
		<div class="flex flex-col gap-4">
			<div class="flex justify-between gap-2">
				<select
					value={table.getFilter('status')}
					onchange={(e) => table.setFilter('status', e.currentTarget.value)}
					class="select-bordered select"
				>
					<option value="">All statuses</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
				</select>

				<label class="input-bordered input">
					<input placeholder="Search by name..." bind:value={table.search} class="grow" />
					<SearchIcon height="16" class="opacity-60" />
				</label>
			</div>

			<div class="flex items-center gap-2">
				<label for="items" class="text-sm">Items per page:</label>
				<select
					id="items"
					class="select-bordered select w-16 select-sm"
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
				<table class="table-pin-rows table table-zebra">
					<thead>
						<tr>
							<th></th>
							<SortableHeader column="name" {table}>Name</SortableHeader>
							<th>Requester</th>
							<SortableHeader column="createdAt" {table}>Created</SortableHeader>
							<SortableHeader column="status" {table}>Status</SortableHeader>
							<th>Handled by</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.reqs as req, index (index)}
							<tr class="hover:bg-base-300">
								<td>{index + 1}</td>
								<!-- name -->
								<td class="p-0">
									{req.organizationName}
								</td>

								<!-- requester -->
								<td class="p-0">
									{req.requesterName}
								</td>
								<!-- created -->
								<td>
									{new Date(req.createdAt).toLocaleDateString()}
								</td>
								<!-- status -->
								<td class="p-0">
									{req.status}
								</td>

								<!-- handled by -->
								<td>{req.reviewedByName ?? req.createdByName ?? '—'}</td>

								<!-- actions -->
								<td>
									{#if req.status === 'pending'}
										<div class="flex gap-2">
											<AcceptTenancy request={req} />
											<RejectTenancy request={req} />
										</div>
									{/if}
								</td>
							</tr>
						{:else}
							<tr><td colspan={7} class="py-6 text-center">No tenants found.</td></tr>
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
