<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Appbar user={data.me} title="Dashboard" description="Organization overview.">
	<div class="mx-auto flex max-w-6xl flex-col gap-8 pb-5">
		<!-- 1. Welcome banner -->
		<section class="rounded-box bg-primary px-6 py-5 text-primary-content shadow">
			<h2 class="text-xl font-bold">Welcome back, {data.me?.name}</h2>
			<p class="opacity-80"></p>
		</section>
	</div>
</Appbar>
