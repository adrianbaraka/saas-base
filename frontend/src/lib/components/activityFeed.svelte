<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { ActivityFeedPageData } from '#lib/server/load-activity-feed.ts';
	import Appbar from './Layout/Appbar.svelte';
	import Section from './Section.svelte';
	import { formatDate } from '#lib/utils.ts';

	let { data, title = 'Activity' }: { data: ActivityFeedPageData; title?: string } = $props();

	const levelClass = {
		low: 'badge-ghost',
		normal: 'badge-soft',
		high: 'badge-soft badge-error'
	} as const;

	const label = (key: string) => key.replaceAll('_', ' ');
	const time = (iso: string) =>
		new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	// Link to this page with some query params changed; null removes a param.
	function hrefWith(changes: Record<string, string | null>) {
		const url = new URL(page.url.href);
		for (const [key, value] of Object.entries(changes)) {
			if (value) url.searchParams.set(key, value);
			else url.searchParams.delete(key);
		}
		return `${url.pathname}${url.search}`;
	}

	// Changing any filter must drop the cursor: it belongs to the old result set.
	function go(changes: Record<string, string | null>) {
		goto(hrefWith({ ...changes, cursor: null }), { reset: false });
	}
</script>

<Appbar user={data.me} {title} description="">
	<div class="flex flex-col gap-4">
		<Section title="Filters" fullWidth>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="flex flex-wrap items-center gap-4">
					<select
						value={data.module}
						onchange={(e) => go({ module: e.currentTarget.value || null })}
						class="select-bordered select"
					>
						<option value="">Module: all</option>
						{#each data.modules as m (m)}
							<option value={m} class="capitalize">{label(m)}</option>
						{/each}
					</select>

					<label class="flex cursor-pointer items-center gap-2 text-sm">
						<input
							type="checkbox"
							class="checkbox checkbox-sm"
							checked={data.includeLow}
							onchange={(e) => go({ includeLow: e.currentTarget.checked ? 'true' : null })}
						/>
						Show low-priority events
					</label>
				</div>

				<button class="btn" title="Reset all filters" onclick={() => goto(page.url.pathname)}>
					Reset
				</button>
			</div>
		</Section>

		<Section title="Activity" fullWidth>
			<div class="m-3 flex items-center gap-2">
				<label for="items" class="text-sm">Items per page:</label>
				<select
					id="items"
					class="select-bordered select w-16 select-sm"
					value={data.limit}
					onchange={(e) => go({ limit: e.currentTarget.value })}
				>
					<option value={20}>20</option>
					<option value={50}>50</option>
					<option value={100}>100</option>
				</select>
			</div>

			<div class="overflow-x-auto">
				<table class="table-pin-rows table table-zebra">
					<thead>
						<tr>
							<th>When</th>
							<th>Module</th>
							<th>What happened</th>
							<th>Level</th>
						</tr>
					</thead>
					<tbody>
						{#each data.items as a (a.id)}
							<tr>
								<td class="whitespace-nowrap">
									<div>{formatDate(a.createdAt)}</div>
									<div class="text-xs opacity-60">{time(a.createdAt)}</div>
								</td>
								<td class="capitalize">{label(a.module)}</td>
								<!-- plain text interpolation: names inside descriptions are escaped -->
								<td>{a.description}</td>
								<td>
									<span class="badge badge-sm capitalize {levelClass[a.level]}">{a.level}</span>
								</td>
							</tr>
						{:else}
							<tr><td colspan={4} class="py-6 text-center">No activity found.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Section>

		<div class="flex items-center gap-2">
			{#if data.cursor}
				<a class="btn btn-sm" href={hrefWith({ cursor: null })}>Newest</a>
			{/if}
			{#if data.nextCursor}
				<a class="btn btn-sm" href={hrefWith({ cursor: data.nextCursor })}>Older →</a>
			{/if}
		</div>
	</div>
</Appbar>
