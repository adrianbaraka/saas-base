<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ActionLevel, IconComponent } from '#lib/interfaces.ts';

	let {
		title,
		description,
		icon: Icon,
		level,
		children
	}: {
		title: string;
		description: string;
		icon?: IconComponent;
		level?: ActionLevel; // omitted = neutral
		children: Snippet;
	} = $props();

	// full class names so Tailwind can see them
	const tone: Record<ActionLevel, string> = {
		warning: 'text-warning',
		danger: 'text-error'
	};
	const toneClass = $derived(level ? tone[level] : '');
</script>

<div class="flex w-full flex-wrap items-center justify-between gap-3">
	<div class="flex max-w-md items-start gap-3">
		{#if Icon}
			<Icon height="24" class="mt-0.5 shrink-0 {toneClass}" aria-hidden="true" />
		{/if}
		<div>
			<p class="font-medium {toneClass}">{title}</p>
			<p class="text-sm text-base-content/70">{description}</p>
		</div>
	</div>
	{@render children()}
</div>
