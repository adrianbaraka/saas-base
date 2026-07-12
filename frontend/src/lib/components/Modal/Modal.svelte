<script lang="ts">
	import { getModal, cancelModal, confirmModal } from './modalStore.svelte';

	let dialog: HTMLDialogElement;

	const modal = $derived(getModal());

	$effect(() => {
		if (!dialog) return;
		if (modal && !dialog.open) {
			dialog.showModal();
		} else if (!modal && dialog.open) {
			dialog.close();
		}
	});

	function handleClose() {
		cancelModal();
	}
</script>

<dialog bind:this={dialog} class="modal" onclose={handleClose}>
	<div class="modal-box">
		<button
			class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
			onclick={cancelModal}
			aria-label="Close"
		>
			✕
		</button>
		{#if modal}
			{#if modal.title}<h3 class="text-lg font-bold mb-5 font-serif">{modal.title}</h3>{/if}
			{@render modal.content({ confirm: confirmModal, cancel: cancelModal })}
		{/if}
	</div>
</dialog>
