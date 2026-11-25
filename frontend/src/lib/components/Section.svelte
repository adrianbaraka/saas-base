<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		vertical = false,
		fullWidth = false,
		badge,
		children
	}: {
		title: string;
		vertical?: boolean;
		fullWidth?: boolean;
		badge?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div
	class={`card w-full border border-base-200 bg-base-100 shadow-xl ${vertical ? 'lg:w-sm lg:max-w-sm' : `${fullWidth ? '' : 'lg:w-2xl lg:max-w-2xl'} `}`}
>
	<div class="card-body p-0">
		<div
			class="flex items-center justify-between rounded-t-2xl border-b border-base-200 bg-primary px-6 py-4"
		>
			<h3 class="text-base font-semibold tracking-wide text-base-content">{title}</h3>
			{#if badge}
				{@render badge()}
			{/if}
		</div>
		<div class="w-full p-4">{@render children()}</div>
	</div>
</div>
