<script lang="ts">
	let {
		title,
		vertical = false,
		badge,
		children
	}: {
		title: string;
		vertical?: boolean;
		badge?: import('svelte').Snippet;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div
	class={`card bg-base-100 shadow-xl border border-base-200 w-full ${vertical ? 'lg:max-w-sm lg:w-sm' : 'lg:max-w-2xl lg:w-2xl'}`}
>
	<div class="card-body p-0">
		<div
			class="flex items-center justify-between px-6 py-4 bg-primary rounded-t-2xl border-b border-base-200"
		>
			<h3 class="font-semibold text-base tracking-wide text-base-content">{title}</h3>
			{#if badge}
				{@render badge()}
			{/if}
		</div>
		{@render children()}
	</div>
</div>
