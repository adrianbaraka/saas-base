<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		children
	}: {
		title?: string;
		children?: Snippet<[{ confirm: () => void; cancel: () => void }]>;
	} = $props();

	let dialog: HTMLDialogElement;
	let resolver: ((confirmed: boolean) => void) | null = null;

	export function show(): Promise<boolean> {
		dialog.showModal();
		return new Promise((resolve) => {
			resolver = resolve;
		});
	}

	export function close() {
		dialog.close();
	}

	function confirm() {
		dialog.close();
		resolver?.(true);
		resolver = null;
	}

	function cancel() {
		dialog.close();
		resolver?.(false);
		resolver = null;
	}

	function handleClose() {
		resolver?.(false);
		resolver = null;
	}
</script>

<dialog bind:this={dialog} class="modal" onclose={handleClose}>
	<div class="modal-box">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		</form>
		{#if title}<h3 class="text-lg font-bold">{title}</h3>{/if}
		{#if children}{@render children({ confirm, cancel })}{/if}
	</div>
</dialog>

<!-- example -->
<!--
let modal: ReturnType<typeof Modal>;

async function handleClick() {
	const confirmed = await modal.show();
	if (confirmed) {
		// do the thing
	}
}

<button class="btn" onclick={handleClick}>open modal</button>

<Modal bind:this={modal} title="Are you sure?">
	{#snippet children({ confirm, cancel })}
		<p class="py-4">This action cannot be undone.</p>
		<div class="modal-action">
			<button class="btn" onclick={cancel}>Cancel</button>
			<button class="btn btn-error" onclick={confirm}>Confirm</button>
		</div>
	{/snippet}
</Modal>
-->
