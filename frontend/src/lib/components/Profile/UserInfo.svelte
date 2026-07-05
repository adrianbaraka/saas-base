<!-- Shows user info like name email etc -->

<script lang="ts">
	import type { BetterAuthUser } from '$lib';
	import Section from '../Section.svelte';

	let { user }: { user: BetterAuthUser } = $props();
</script>

<Section title="Basic Information" badge={BannedBadge} children={info} />

{#snippet BannedBadge()}
	{#if user.banned}
		<div class="badge badge-error gap-1.5">
			<span class="w-1.5 h-1.5 rounded-full bg-current"></span>
			Banned
		</div>
	{:else}
		<div class="badge badge-success gap-1.5">
			<span class="w-1.5 h-1.5 rounded-full bg-current"></span>
			Active
		</div>
	{/if}
{/snippet}

{#snippet info()}
	<div class="grid grid-cols-2 divide-x divide-base-200">
		<!-- Name -->
		<div class="flex flex-col gap-1 px-6 py-4 border-b border-base-200">
			<span class="text-xs font-medium text-base-content/70 uppercase tracking-widest">Name</span>
			<span class="text-sm text-base-content font-medium">{user.name}</span>
		</div>

		<!-- Role -->
		<div class="flex flex-col gap-1 px-6 py-4 border-b border-base-200">
			<span class="text-xs font-medium text-base-content/70 uppercase tracking-widest">Role</span>
			<div class="badge badge-ghost badge-sm capitalize">{user.role}</div>
		</div>

		<!-- Email -->
		<div class="flex flex-col gap-1 px-6 py-4 border-b border-base-200">
			<span class="text-xs font-medium text-base-content/70 uppercase tracking-widest">Email</span>
			<div class="flex items-center gap-2 flex-col md:flex-row">
				<span class="text-sm text-base-content font-medium">{user.email}</span>
				{#if user.emailVerified}
					<div class="badge badge-success badge-xs">Verified</div>
				{:else}
					<div class="badge badge-warning badge-xs">Unverified</div>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-1 px-6 py-4 border-b border-base-200"></div>

		<!-- Joined -->
		<div class="flex flex-col gap-1 px-6 py-4">
			<span class="text-xs font-medium text-base-content/70 uppercase tracking-widest">Joined</span>
			<span class="text-sm font-mono">{new Date(user.createdAt).toLocaleDateString()}</span>
		</div>

		<!-- Last Updated -->
		<div class="flex flex-col gap-1 px-6 py-4">
			<span class="text-xs text-base-content/70 font-medium uppercase tracking-widest"
				>Last Updated</span
			>
			<span class="text-sm font-mono">{new Date(user.updatedAt).toLocaleDateString()}</span>
		</div>
	</div>
{/snippet}
