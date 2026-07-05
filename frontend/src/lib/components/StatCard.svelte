<script lang="ts">
	import type { IconComponent } from '$lib';

	let {
		title,
		value,
		desc,
		Icon,
		color
	}: { title: string; value: string; desc: string; Icon: IconComponent; color: string } = $props();
</script>

<div class={`stats border-l-2 shadow-xl w-full md:w-fit ${color}`}>
	<div class="stat">
		<div class={`stat-figure ${color}`}><Icon height="35" /></div>
		<div class="stat-title">{title}</div>
		<div class={`stat-value ${color}`}>{value}</div>
		<div class="stat-desc">{desc}</div>
	</div>
</div>
