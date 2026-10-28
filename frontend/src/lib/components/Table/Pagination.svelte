<script lang="ts">
	interface Props {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	}

	let { currentPage, totalPages, onPageChange }: Props = $props();

	const middlePages = $derived.by(() => {
		if (totalPages <= 7) return [];
		return Array.from({ length: totalPages }, (_, i) => i + 1).filter(
			(p) => p > 1 && p < totalPages && Math.abs(p - currentPage) <= 1
		);
	});

	const allPages = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));
</script>

<div class="join">
	<button
		class="btn join-item btn-sm"
		disabled={currentPage === 1}
		onclick={() => onPageChange(currentPage - 1)}
	>
		«
	</button>

	{#if totalPages <= 7}
		{#each allPages as p (p)}
			<button
				class="btn join-item btn-sm {p === currentPage ? 'btn-active' : ''}"
				onclick={() => onPageChange(p)}
			>
				{p}
			</button>
		{/each}
	{:else}
		<button
			class="btn join-item btn-sm {currentPage === 1 ? 'btn-active' : ''}"
			onclick={() => onPageChange(1)}
		>
			1
		</button>

		{#if currentPage > 3}
			<button class="btn btn-disabled join-item btn-sm">...</button>
		{/if}

		{#each middlePages as p (p)}
			<button
				class="btn join-item btn-sm {p === currentPage ? 'btn-active' : ''}"
				onclick={() => onPageChange(p)}
			>
				{p}
			</button>
		{/each}

		{#if currentPage < totalPages - 2}
			<button class="btn btn-disabled join-item btn-sm">...</button>
		{/if}

		<button
			class="btn join-item btn-sm {currentPage === totalPages ? 'btn-active' : ''}"
			onclick={() => onPageChange(totalPages)}
		>
			{totalPages}
		</button>
	{/if}

	<button
		class="btn join-item btn-sm"
		disabled={currentPage === totalPages}
		onclick={() => onPageChange(currentPage + 1)}
	>
		»
	</button>
</div>
