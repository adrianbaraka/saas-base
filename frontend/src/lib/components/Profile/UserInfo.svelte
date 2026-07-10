<!-- Shows user info like name email etc -->

<script lang="ts">
	import type { BetterAuthUser } from '$lib';
	import { isEffectivelyBanned } from '$lib/utils';
	import Section from '../Section.svelte';

	let { user }: { user: BetterAuthUser } = $props();
</script>

<Section title="Basic Information" badge={BannedBadge} children={info} />

{#snippet BannedBadge()}
	{#if isEffectivelyBanned(user.banned, user.banExpires)}
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

{#snippet field(label: string, value: string)}
	<div class="px-6 py-4 border-b border-base-200 max-w-full overflow-hidden">
		<span class="text-xs font-medium text-base-content/70 uppercase tracking-widest">{label}</span>
		<div class="text-sm text-base-content font-medium mt-1 wrap-break-word">{value}</div>
	</div>
{/snippet}

{#snippet info()}
	<div class="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-base-200">
		{@render field('Name', user.name)}

		<div class="px-6 py-4 border-b border-base-200">
			<span class="text-xs font-medium text-base-content/70 uppercase tracking-widest">Role</span>
			<div class="badge badge-ghost badge-sm capitalize mt-1">{user.role}</div>
		</div>

		<div class="px-6 py-4 border-b border-base-200">
			<span class="text-xs font-medium text-base-content/70 uppercase tracking-widest">Email</span>
			<div class="flex items-center gap-2 mt-1">
				<span class="text-sm text-base-content font-medium">{user.email}</span>
				{#if user.emailVerified}
					<div class="badge badge-success badge-xs">Verified</div>
				{:else}
					<div class="badge badge-warning badge-xs">Unverified</div>
				{/if}
			</div>
		</div>

		{#if isEffectivelyBanned(user.banned, user.banExpires) && user.banExpires}
			{@render field('Ban reason', user.banReason ?? '—')}
			{@render field(
				'Ban expires',
				`${new Date(user.banExpires).toDateString()} at ${new Date(user.banExpires).toLocaleTimeString()}`,
			)}
		{/if}

		{@render field('Joined', new Date(user.createdAt).toLocaleDateString())}
		{@render field('Last Updated', new Date(user.updatedAt).toLocaleDateString())}
	</div>
{/snippet}