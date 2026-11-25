<script lang="ts">
	import type { PendingItem } from '#lib/pending.ts';

	let {
		pending,
		title = 'Needs Attention'
	}: {
		pending: Promise<PendingItem[] | null>;
		title?: string;
	} = $props();
</script>

<section class="card overflow-hidden bg-base-200 shadow">
	<div class="bg-primary px-6 py-4 text-primary-content">
		<h3 class="font-semibold">{title}</h3>
	</div>

	<div class="card-body gap-0 p-0">
		{#await pending}
			{#each { length: 3 } as _, i (i)}
				<div class="flex items-center gap-4 border-b border-base-300 px-6 py-4 last:border-b-0">
					<div class="h-8 w-12 skeleton rounded-lg"></div>
					<div class="h-4 flex-1 skeleton"></div>
					<div class="h-8 w-16 skeleton rounded-lg"></div>
				</div>
			{/each}
		{:then items}
			{#if items === null}
				<div role="alert" class="px-6 py-6 text-sm text-error">
					Couldn't load pending work. Try refreshing the page.
				</div>
			{:else if items.length === 0}
				<div class="px-6 py-6 text-sm opacity-70">
					You're all caught up. Nothing needs attention.
				</div>
			{:else}
				<ul>
					{#each items as item (item.id)}
						<li class="flex items-center gap-4 border-b border-base-300 px-6 py-4 last:border-b-0">
							<span class="badge min-w-12 badge-lg font-bold badge-warning">{item.count}</span>
							<span class="flex-1">{item.label}</span>
							<a href={item.href} class="btn btn-primary btn-sm">{item.action}</a>
						</li>
					{/each}
				</ul>
			{/if}
		{/await}
	</div>
</section>
