<script lang="ts">
	import { goto, refreshAll } from '$app/navigation';
	import { authClient } from '#lib/auth-client.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const roleLabels: Record<string, string> = {
		owner: 'Owner',
		admin: 'Admin'
	};

	let signingOut = $state(false);
	let checking = $state(false);

	async function signOut() {
		signingOut = true;
		try {
			await authClient.signOut();
			await goto('/login', { invalidateAll: true });
		} catch (err) {
			console.error('Sign out failed:', err);
		} finally {
			signingOut = false;
		}
	}

	async function checkAgain() {
		checking = true;
		try {
			// Reruns the server load. If the user was added to an org, they get redirected
			await refreshAll();
		} finally {
			checking = false;
		}
	}
</script>

<svelte:head>
	<title>Continue</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
	{#if data.destinations.length === 0}
		<div class="text-center">
			<h1 class="text-2xl font-semibold">No organization yet</h1>
			<p class="mt-2 text-base-content/70">
				You do not belong to any organization. Ask your administrator to add you.
			</p>
		</div>

		<div class="flex flex-col gap-2 sm:flex-row sm:justify-center">
			<button class="btn btn-primary" onclick={checkAgain} disabled={checking || signingOut}>
				{#if checking}<span class="loading loading-sm loading-spinner"></span>{/if}
				Check again
			</button>
			<button class="btn btn-ghost" onclick={signOut} disabled={checking || signingOut}>
				{#if signingOut}<span class="loading loading-sm loading-spinner"></span>{/if}
				Sign out
			</button>
		</div>
	{:else}
		<div class="text-center">
			<h1 class="text-2xl font-semibold">Where to?</h1>
			<p class="mt-2 text-base-content/70">Choose where you want to continue.</p>
		</div>

		<ul class="flex flex-col gap-3">
			{#each data.destinations as dest (dest.href)}
				<li>
					<a
						href={dest.href}
						class="card bg-base-100 transition-colors card-border hover:bg-base-200"
					>
						<div class="card-body flex-row items-center justify-between p-4">
							<span class="font-medium">{dest.name}</span>
							{#if dest.role}
								<span class="badge badge-outline">{roleLabels[dest.role] ?? dest.role}</span>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<button class="btn self-center btn-ghost btn-sm" onclick={signOut} disabled={signingOut}>
			{#if signingOut}<span class="loading loading-sm loading-spinner"></span>{/if}
			Sign out
		</button>
	{/if}
</main>
