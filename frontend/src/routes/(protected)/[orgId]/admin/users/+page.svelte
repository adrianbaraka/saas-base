<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import Pagination from '#lib/components/Table/Pagination.svelte';
	import SortableHeader from '#lib/components/Table/SortableHeader.svelte';
	import Section from '#lib/components/Section.svelte';
	import type { PageProps } from './$types';
	import SearchIcon from '@iconify-svelte/material-symbols/search';
	import CheckIcon from '@iconify-svelte/material-symbols/check';
	import { pluralSuffix } from '#lib/utils.ts';
	import { TableUrlState } from '#lib/components/Table/tableUrlState.svelte.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();

	const table = $derived(new TableUrlState(data));

	$effect(() => {
		table.sync(data);
	});

	const totalPages = $derived(Math.ceil(data.total / table.limit));
	const currentPage = $derived(Math.floor(data.offset / table.limit) + 1);
	const base = $derived(`/${encodeURIComponent(page.params.orgId ?? '')}/admin/users`);
	// role is stored comma-separated ("admin,billing")
	const splitRoles = (role: string) =>
		role
			.split(',')
			.map((r) => r.trim())
			.filter(Boolean);
</script>

{#snippet totalMembers()}
	<div>{data.total} member{pluralSuffix(data.total)}</div>
{/snippet}

<Appbar user={data.me} title="Members" description="">
	<div class="flex flex-col gap-4">
		<Section title="Filters" fullWidth>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="flex flex-wrap gap-2">
					<select
						value={table.getFilter('emailVerified')}
						onchange={(e) => table.setFilter('emailVerified', e.currentTarget.value)}
						class="select-bordered select"
					>
						<option value="">Email status: any</option>
						<option value="true">Verified</option>
						<option value="false">Unverified</option>
					</select>

					<select
						value={table.getFilter('role')}
						onchange={(e) => table.setFilter('role', e.currentTarget.value)}
						class="select-bordered select"
					>
						<option value="">Role: any</option>
						{#each data.roles as r (r.name)}
							<option value={r.name} class="capitalize">{r.name}</option>
						{/each}
					</select>
				</div>

				<button class="btn" title="Reset all filters" onclick={() => goto(page.url.pathname)}>
					Reset
				</button>
			</div>
		</Section>

		<Section title="Members" fullWidth badge={totalMembers}>
			<div class="m-3 flex justify-end">
				<label class="input-bordered input ml-auto">
					<input
						placeholder="Search by name/email/phone..."
						bind:value={table.search}
						class="grow"
						maxlength="100"
					/>
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
							<th>Phone</th>
							<!-- not sortable: the backend only allows createdAt | name | email -->
							<th>Email Status</th>
							<th>Role</th>
							<SortableHeader column="createdAt" {table}>Joined</SortableHeader>
						</tr>
					</thead>
					<tbody>
						{#each data.members as m (m.id)}
							{@const href = `${base}/${encodeURIComponent(m.id)}`}
							<tr class="hover:bg-base-300">
								<td class="p-0">
									<a {href} class="block px-4 py-3 font-medium">{m.name}</a>
								</td>
								<td class="p-0">
									<a {href} class="block px-4 py-3">{m.email}</a>
								</td>
								<td class="p-0">
									<a {href} class="block px-4 py-3">
										{#if m.phone?.length}
											{m.phone.join(', ')}
										{:else}
											<span class="opacity-60">—</span>
										{/if}
									</a>
								</td>
								<td class="p-0">
									<a {href} class="block px-4 py-3">
										{#if m.emailVerified}
											<span class="badge badge-soft badge-sm text-blue-800 dark:badge-primary">
												<CheckIcon height="16" />Verified
											</span>
										{:else}
											<span class="badge badge-soft badge-sm badge-warning">Unverified</span>
										{/if}
									</a>
								</td>
								<td class="p-0">
									<a {href} class="block px-4 py-3">
										<div class="flex flex-wrap gap-1">
											{#each splitRoles(m.role) as r (r)}
												<span class="badge badge-soft badge-sm capitalize">{r}</span>
											{/each}
										</div>
									</a>
								</td>
								<td class="p-0">
									<a {href} class="block px-4 py-3">{new Date(m.createdAt).toLocaleDateString()}</a>
								</td>
							</tr>
						{:else}
							<tr><td colspan={6} class="py-6 text-center">No members found.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Section>

		<div class="flex items-center gap-4">
			<Pagination {currentPage} {totalPages} onPageChange={(p) => table.goToPage(p)} />

			{#if data.total > 0}
				<span class="text-sm text-gray-500">
					{data.offset + 1}–{Math.min(data.offset + table.limit, data.total)} of {data.total} members
				</span>
			{/if}
		</div>
	</div>
</Appbar>
