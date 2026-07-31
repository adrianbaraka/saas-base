<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TableUrlState } from './tableUrlState.svelte';

	interface Props {
		column: string;
		table: TableUrlState;
		children: Snippet;
	}

	let { column, table, children }: Props = $props();
</script>

<th class="cursor-pointer select-none" onclick={() => table.toggleSort(column)}>
	{@render children()} {table.arrow(column)}
</th>