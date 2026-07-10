<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Appbar from '$lib/components/Layout/Appbar.svelte';
	import type { PageProps } from './$types';
	import SearchIcon from '@iconify-svelte/material-symbols/search';
	import CheckIcon from '@iconify-svelte/material-symbols/check';
	import StatCard from '$lib/components/StatCard.svelte';
	import GroupIcon from '@iconify-svelte/material-symbols/group';
	import BlockIcon from '@iconify-svelte/material-symbols/block';
	import MarkEmailUnreadIcon from '@iconify-svelte/material-symbols/mark-email-unread';
	import AdminPanelSettingsIcon from '@iconify-svelte/material-symbols/admin-panel-settings';
	import { isEffectivelyBanned } from '$lib/utils';
	let { data }: PageProps = $props();
	let search = $derived(data.search);
	let limit = $derived(data.limit);

	const totalPages = $derived(Math.ceil(data.total / data.limit));
	const currentPage = $derived(Math.floor(data.offset / data.limit) + 1);

	function goToPage(p: number) {
		const params = new URLSearchParams(page.url.searchParams); // ← no $
		params.set('offset', String((p - 1) * data.limit));
		goto(`?${params}`);
	}

	function onSearch() {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('search', search);
		params.set('offset', '0');
		goto(`?${params}`);
	}

	function onLimitChange() {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('limit', String(limit));
		params.set('offset', '0'); // reset to first page
		goto(`?${params}`);
	}

	function toggleSort(col: string) {
		const params = new URLSearchParams(page.url.searchParams); // ← no $
		const currentSort = params.get('sortBy');
		const currentDir = params.get('sortDirection') ?? 'desc';
		params.set('sortBy', col);
		params.set('sortDirection', currentSort === col && currentDir === 'asc' ? 'desc' : 'asc');
		params.set('offset', '0');
		goto(`?${params}`);
	}

	function arrow(col: string) {
		if (data.sortBy !== col) return '↕';
		return data.sortDirection === 'asc' ? '↑' : '↓';
	}

	// stats
	function stats() {
		return [
			{
				title: 'Total Users',
				value: `${data.stats.totalUsers}`,
				desc: 'Registered accounts',
				color: '',
				Icon: GroupIcon
			},
			{
				title: 'Admin Users',
				value: `${data.stats.adminUsers}`,
				desc: 'Assigned admin role',
				color: 'text-success',
				Icon: AdminPanelSettingsIcon
			},
			{
				title: 'Unverified Users',
				value: `${data.stats.unverifiedUsers}`,
				desc: 'Email not verified',
				color: 'text-warning',
				Icon: MarkEmailUnreadIcon
			},
			{
				title: 'Banned Users',
				value: `${data.stats.bannedUsers}`,
				desc: 'Currently banned',
				color: 'text-red-700',
				Icon: BlockIcon
			}
		];
	}
</script>

<Appbar user={data.me} title="Manage Users" description="View and Manage all users in the system.">
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
	<div class="">
		<h2 class="text-2xl font-bold mb-5">Users</h2>

		<div class="flex flex-col gap-4">
			<!-- Search -->
			<div class="flex justify-end">
				<label class="input input-bordered">
					<input
						placeholder="Search by email..."
						bind:value={search}
						onkeydown={(e) => e.key === 'Enter' && onSearch()}
						class="grow"
					/>
					<button
						onclick={onSearch}
						aria-label="Search"
						class="opacity-60 hover:opacity-100 cursor-pointer"
					>
						<SearchIcon height="16" />
					</button>
				</label>
			</div>
			<!-- items per page -->
			<div class="flex items-center gap-2">
				<label for="items" class="text-sm">Items per page:</label>
				<select
					id="items"
					name="items"
					class="select select-bordered w-16 select-sm"
					bind:value={limit}
					onchange={onLimitChange}
				>
					<option value={5}>5</option>
					<option value={20}>20</option>
					<option value={50}>50</option>
					<option value={100}>100</option>
				</select>
			</div>

			<!-- Table -->
			<div class="overflow-x-auto">
				<table class="table table-zebra table-pin-rows">
					<thead>
						<tr>
							<th class="cursor-pointer select-none" onclick={() => toggleSort('name')}>
								Name {arrow('name')}
							</th>
							<th class="cursor-pointer select-none" onclick={() => toggleSort('email')}>
								Email {arrow('email')}
							</th>
							<th class="cursor-pointer select-none" onclick={() => toggleSort('emailVerified')}>
								Email Status {arrow('emailVerified')}
							</th>
							<th class="cursor-pointer select-none" onclick={() => toggleSort('role')}>
								Role {arrow('role')}
							</th>
							<th class="cursor-pointer select-none" onclick={() => toggleSort('createdAt')}>
								Created {arrow('createdAt')}
							</th>
							<th class="cursor-pointer select-none" onclick={() => toggleSort('banned')}
								>Account Status {arrow('banned')}</th
							>
						</tr>
					</thead>
					<tbody>
						{#each data.users as user}
							<!-- repetitive a link but the only way  -->
							<tr class="hover:bg-base-300">
								<td class="p-0">
									<a href={`/admin/users/${user.id}`} class="flex px-4 py-2">{user.name}</a>
								</td>
								<td class="p-0">
									<a href={`/admin/users/${user.id}`} class="flex px-4 py-2">{user.email}</a>
								</td>
								<td class="p-0">
									<a href={`/admin/users/${user.id}`} class="flex px-4 py-2">
										{#if user.emailVerified}
											<span class="badge text-blue-800 dark:badge-primary badge-soft badge-sm"
												><CheckIcon height="16" />Verified</span
											>
										{:else}
											<span class="badge badge-warning badge-soft badge-sm">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													viewBox="0 0 24 24"
												>
													<path d="M0 0h24v24H0z" fill="none" />
													<path
														fill="none"
														stroke="currentColor"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 6V3m0 18v-2m7-7h2M3 12h3m11.657-5.657l.707-.707M5.636 18.364L7.05 16.95m9.9 0l1.414 1.414M5.636 5.636l2.121 2.121"
													/>
												</svg>

												Unverified</span
											>
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
							<tr>
								<td colspan={6} class="text-center py-6">No users found.</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			<div class="flex items-center gap-4">
				<div class="join">
					<!-- Go back -->
					<button
						class="join-item btn btn-sm"
						disabled={currentPage === 1}
						onclick={() => goToPage(currentPage - 1)}
					>
						«
					</button>

					{#if totalPages <= 7}
						{#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
							<button
								class="join-item btn btn-sm {p === currentPage ? 'btn-active' : ''}"
								onclick={() => goToPage(p)}
							>
								{p}
							</button>
						{/each}
					{:else}
						<button
							class="join-item btn btn-sm {currentPage === 1 ? 'btn-active' : ''}"
							onclick={() => goToPage(1)}
						>
							1
						</button>

						{#if currentPage > 3}
							<button class="join-item btn btn-sm btn-disabled">...</button>
						{/if}

						{#each Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p > 1 && p < totalPages && Math.abs(p - currentPage) <= 1) as p}
							<button
								class="join-item btn btn-sm {p === currentPage ? 'btn-active' : ''}"
								onclick={() => goToPage(p)}
							>
								{p}
							</button>
						{/each}

						{#if currentPage < totalPages - 2}
							<button class="join-item btn btn-sm btn-disabled">...</button>
						{/if}
						<!-- last page -->
						<button
							class="join-item btn btn-sm {currentPage === totalPages ? 'btn-active' : ''}"
							onclick={() => goToPage(totalPages)}
						>
							{totalPages}
						</button>
					{/if}
					<!-- next page -->
					<button
						class="join-item btn btn-sm"
						disabled={currentPage === totalPages}
						onclick={() => goToPage(currentPage + 1)}
					>
						»
					</button>
				</div>

				<span class="text-sm text-gray-500">
					{data.offset + 1}–{Math.min(data.offset + data.limit, data.total)} of {data.total} users
				</span>
			</div>
		</div>
	</div>
</Appbar>
