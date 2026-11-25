<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TableUrlState } from './tableUrlState.svelte';
	import UnfoldMoreIcon from '@iconify-svelte/material-symbols/unfold-more';
	import ArrowUpwardIcon from '@iconify-svelte/material-symbols/arrow-upward';
	import ArrowDownwardIcon from '@iconify-svelte/material-symbols/arrow-downward';

	interface Props {
		column: string;
		table: TableUrlState;
		children: Snippet;
	}

	let { column, table, children }: Props = $props();

	const state = $derived(table.sortState(column));
</script>

<th
	class="cursor-pointer select-none"
	aria-sort={state === 'asc' ? 'ascending' : state === 'desc' ? 'descending' : 'none'}
	onclick={() => table.toggleSort(column)}
>
	<span class="inline-flex items-center gap-1">
		{@render children()}
		{#if state === 'asc'}
			<ArrowUpwardIcon height="16" />
		{:else if state === 'desc'}
			<ArrowDownwardIcon height="16" />
		{:else}
			<UnfoldMoreIcon height="16" class="opacity-40" />
		{/if}
	</span>
</th>
