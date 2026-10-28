<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import Pagination from '#lib/components/Table/Pagination.svelte';
	import SortableHeader from '#lib/components/Table/SortableHeader.svelte';
	import type { PageProps } from './$types';
	import SearchIcon from '@iconify-svelte/material-symbols/search';
	import { TableUrlState } from '#lib/components/Table/tableUrlState.svelte.js';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	const table = $derived(new TableUrlState(data));

	$effect(() => {
		table.sync(data);
	});

	const totalPages = $derived(Math.ceil(data.total / table.limit));
	const currentPage = $derived(Math.floor(data.offset / table.limit) + 1);

	function badge(status: string) {
		if (status === 'pending') {
			return 'badge-warning';
		} else if (status === 'approved') {
			return 'badge-success';
		} else {
			return 'badge-error';
		}
	}
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
				<table class="table table-pin-rows table-zebra">
					<thead>
						<tr>
							<th></th>
							<SortableHeader column="name" {table}>Name</SortableHeader>
							<SortableHeader column="createdAt" {table}>Created</SortableHeader>
							<SortableHeader column="status" {table}>Status</SortableHeader>
						</tr>
					</thead>
					<tbody>
						{#each data.reqs as req, index (index)}
							<tr class="hover:bg-base-300">
								<td>{index + 1}</td>
								<!-- name -->
								<td class="p-0">
									<a href={resolve(`platform-admin/requests/${req.id}`)} class="flex px-4 py-2"
										>{req.name}</a
									>
								</td>
								<!-- created -->
								<td>
									<a href={resolve(`platform-admin/requests/${req.id}`)} class="flex px-4 py-2"
										>{new Date(req.createdAt).toLocaleDateString()}</a
									>
								</td>
								<!-- status -->
								<td class="p-0">
									<a
										href={resolve(`platform-admin/requests/${req.id}`)}
										class={`badge badge-soft ${badge(req.status)}`}
									>
										{req.status}
									</a>
								</td>
							</tr>
						{:else}
							<tr><td colspan={5} class="py-6 text-center">No tenants found.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="flex items-center gap-4">
				<Pagination {currentPage} {totalPages} onPageChange={(p) => table.goToPage(p)} />

				<span class="text-sm text-gray-500"
					>{data.offset + 1}–{Math.min(data.offset + table.limit, data.total)} of {data.total} users</span
				>
			</div>
		</div>
	</div>
</Appbar>
