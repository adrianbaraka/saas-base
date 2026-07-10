<script lang="ts">
	import Appbar from '$lib/components/Appbar.svelte';
	import { openModal } from '$lib/components/Modal/modal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
		async function handleClick() {
			const confirmed = await openModal({
				title: 'Are you sure?',
				content: confirmSnippet
		});
		if (confirmed) {
			console.log("confirmed");
		} else {
			console.log("not confirmed");
			
		}
	}
</script>

{#snippet confirmSnippet({ confirm, cancel }: { confirm: () => void; cancel: () => void })}
	<p class="py-4">This action cannot be undone.</p>
	<div class="modal-action">
		<button class="btn" onclick={cancel}>Cancel</button>
		<button class="btn btn-error" onclick={confirm}>Confirm</button>
	</div>
{/snippet}

<Appbar
	user={data.me}
	title="Dashboard"
	description="An overview of overall system stats."
>
	<div class="">hello dashboard</div>
	<button class="btn" onclick={handleClick}>click me</button>
</Appbar>


