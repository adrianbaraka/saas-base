<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import Pagination from '#lib/components/Table/Pagination.svelte';
	import SortableHeader from '#lib/components/Table/SortableHeader.svelte';
	import Section from '#lib/components/Section.svelte';
	import type { PageProps } from './$types';
	import SearchIcon from '@iconify-svelte/material-symbols/search';
	import CheckIcon from '@iconify-svelte/material-symbols/check';
	import { TableUrlState } from '#lib/components/Table/tableUrlState.svelte.js';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import ResendWelcome from '#lib/components/Actions/resendWelcome.svelte';
	import AddAdmin from '#lib/components/Actions/addAdmin.svelte';

	let { data }: PageProps = $props();

	const table = $derived(new TableUrlState(data));

	$effect(() => {
		table.sync(data);
	});

	const totalPages = $derived(Math.ceil(data.total / table.limit));
	const currentPage = $derived(Math.floor(data.offset / table.limit) + 1);
</script>

{#snippet addAdminSnippet()}
	<AddAdmin />
{/snippet}

<Appbar user={data.me} title="Manage Platform Admins" description="">
	<div class="flex flex-col gap-4">
		<Section title="Filters" fullWidth>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<select
					value={table.getFilter('emailVerified')}
					onchange={(e) => table.setFilter('emailVerified', e.currentTarget.value)}
					class="select-bordered select"
				>
					<option value="">Email status: any</option>
					<option value="true">Verified</option>
					<option value="false">Unverified</option>
				</select>

				<button
					class="btn"
					title="Reset all filters"
					onclick={() => goto(resolve('/(protected)/platform-admin/users'))}
				>
					Reset
				</button>
			</div>
		</Section>

		<Section title="Users" fullWidth badge={addAdminSnippet}>
			<div class="m-3 flex justify-end">
				<label class="input-bordered input ml-auto">
					<input placeholder="Search by name/email..." bind:value={table.search} class="grow" />
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
							<SortableHeader column="name" {table}>Name</SortableHeader>
							<SortableHeader column="email" {table}>Email</SortableHeader>
							<SortableHeader column="emailVerified" {table}>Email Status</SortableHeader>
							<th>Platform Admin</th>
							<SortableHeader column="createdAt" {table}>Created</SortableHeader>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.users as user (user.id)}
							<tr class="hover:bg-base-300">
								<td>{user.name}</td>
								<td>{user.email}</td>
								<td>
									{#if user.emailVerified}
										<span class="badge badge-soft badge-sm text-blue-800 dark:badge-primary">
											<CheckIcon height="16" />Verified
										</span>
									{:else}
										<span class="badge badge-soft badge-sm badge-warning">Unverified</span>
									{/if}
								</td>
								<td>
									{#if user.isPlatformAdmin}
										<CheckIcon height="20" class="text-success" aria-label="Platform admin" />
									{:else}
										<span class="opacity-60">—</span>
									{/if}
								</td>
								<td>{new Date(user.createdAt).toLocaleDateString()}</td>
								<td>
									{#if !user.emailVerified}
										<ResendWelcome email={user.email} />
									{/if}
								</td>
							</tr>
						{:else}
							<tr><td colspan={6} class="py-6 text-center">No users found.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Section>

		<div class="flex items-center gap-4">
			<Pagination {currentPage} {totalPages} onPageChange={(p) => table.goToPage(p)} />

			{#if data.total > 0}
				<span class="text-sm text-gray-500">
					{data.offset + 1}-{Math.min(data.offset + table.limit, data.total)} of {data.total} users
				</span>
			{/if}
		</div>
	</div>
</Appbar>
