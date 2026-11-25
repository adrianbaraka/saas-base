<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import Section from '#lib/components/Section.svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { field } from '#lib/components/formComponents.svelte';
	import { formatDate } from '#lib/utils.ts';
	import ResendWelcome from '#lib/components/Actions/resendWelcome.svelte';

	let { data }: PageProps = $props();

	const org = $derived(data.org);
</script>

<Appbar user={data.me} title={org.name} description="">
	<div class="flex flex-col gap-6">
		<Section title="Overview" fullWidth>
			<div class="flex flex-wrap">
				{@render field('Name', org.name)}
				{@render field('Slug', org.slug)}
				{@render field('Members', String(org.memberCount))}
				{@render field('Created', formatDate(org.createdAt))}
			</div>
			{#each org.owners as owner (owner.id)}
				<div class="flex flex-wrap">
					{@render field('Owner', owner.name)}
					{@render field('Email', owner.email)}
					{#if owner.setupComplete}
						{@render field('Setup', 'Complete')}
					{:else}
						<div
							class="flex max-w-full grow items-center gap-3 border-b border-base-200 px-6 py-4 lg:basis-1/3"
						>
							<span class="badge badge-soft badge-sm badge-warning">Setup pending</span>
							<ResendWelcome email={owner.email} />
						</div>
					{/if}
				</div>
			{:else}
				<p class="px-6 py-4 opacity-60">This organization has no owners.</p>
			{/each}
		</Section>
		<Section title="Origin request" fullWidth>
			{#if org.request}
				<div class="flex flex-wrap">
					{@render field('Requested', formatDate(org.request.createdAt))}
					{@render field('Created by', org.request.createdByName ?? '—')}
					{@render field('Reviewed by', org.request.reviewedByName ?? '—')}
					{@render field('Reviewed', formatDate(org.request.reviewedAt))}
				</div>
				<div class="px-6 py-4">
					<a class="link" href={resolve('/(protected)/platform-admin/requests')}>
						View original request
					</a>
				</div>
			{:else}
				<p class="px-6 py-4 opacity-60">No request is recorded for this organization.</p>
			{/if}
		</Section>
	</div>
</Appbar>
