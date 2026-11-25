<script lang="ts">
	import Appbar from '#lib/components/Layout/Appbar.svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import Section from '#lib/components/Section.svelte';
	import CreateOrg from '#lib/components/Actions/createOrg.svelte';

	let { data }: PageProps = $props();
</script>

{#snippet newTenant()}
	<CreateOrg />
{/snippet}
<Appbar user={data.me} title="Manage Organizations" description="">
	<Section title="Tenants" fullWidth badge={newTenant}>
		<div class="overflow-x-auto">
			<table class="table-pin-rows table table-zebra">
				<thead>
					<tr>
						<th>Name</th>
						<th>Slug</th>
						<th>Members</th>
						<th>Owner</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{#each data.orgs as org (org.id)}
						{@const href = resolve('/(protected)/platform-admin/tenants/[id]', { id: org.id })}
						{@const owner = org.owners[0]}
						<tr class="hover:bg-base-300">
							<td class="p-0">
								<a {href} class="flex px-4 py-2">{org.name}</a>
							</td>
							<td class="p-0">
								<a {href} class="flex px-4 py-2">{org.slug}</a>
							</td>
							<td class="p-0">
								<a {href} class="flex px-4 py-2">{org.memberCount}</a>
							</td>
							<td class="p-0">
								<a {href} class="flex flex-col gap-1 px-4 py-2 no-underline!">
									{#if owner}
										<span>{owner.name}</span>
										<span class="text-sm opacity-60">{owner.email}</span>
										<span
											class={`badge badge-soft badge-sm ${owner.setupComplete ? 'badge-success' : 'badge-warning'}`}
										>
											{owner.setupComplete ? 'Setup complete' : 'Setup pending'}
										</span>
									{:else}
										<span class="opacity-60">—</span>
									{/if}
								</a>
							</td>
							<td class="p-0">
								<a {href} class="flex px-4 py-2">{new Date(org.createdAt).toLocaleDateString()}</a>
							</td>
						</tr>
					{:else}
						<tr><td colspan={5} class="py-6 text-center">No organizations found.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Section>
</Appbar>
