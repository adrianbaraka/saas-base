<script lang="ts">
	import type { IconComponent } from '#lib/interfaces.ts';
	import VisibilityIcon from '@iconify-svelte/material-symbols/visibility';
	import VisibilityOffIcon from '@iconify-svelte/material-symbols/visibility-off';

	let {
		title,
		value,
		desc,
		Icon,
		color,
		href,
		isPrivate = false
	}: {
		title: string;
		value: string;
		desc: string;
		Icon: IconComponent;
		color: string;
		href?: string;
		isPrivate?: boolean;
	} = $props();

	let hidden = $state(true);
	const masked = $derived(isPrivate && hidden);
</script>

<div class={`stats w-full border-l-2 shadow-xl md:w-fit ${color}`}>
	<div class="stat">
		<div class={`stat-figure ${color}`}><Icon height="35" /></div>
		<div class="stat-title flex items-center gap-1">
			{title}
			{#if isPrivate}
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-xs"
					aria-label={hidden ? 'Show value' : 'Hide value'}
					aria-pressed={!hidden}
					onclick={() => (hidden = !hidden)}
				>
					{#if hidden}
						<VisibilityOffIcon height="16" />
					{:else}
						<VisibilityIcon height="16" />
					{/if}
				</button>
			{/if}
		</div>
		<div class={`stat-value ${color}`}>
			{#if masked}
				<span aria-label="Hidden value">••••</span>
			{:else}
				{value}
			{/if}
		</div>
		<div class="stat-desc whitespace-normal">
			{#if href}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolve()d paths -->
				<a {href} class="link link-hover focus-visible:outline-2 focus-visible:outline-primary">
					{desc}<span aria-hidden="true"> →</span>
				</a>
			{:else}
				{desc}
			{/if}
		</div>
	</div>
</div>
