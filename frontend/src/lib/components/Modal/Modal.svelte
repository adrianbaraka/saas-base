<script lang="ts">
	import { getModal, cancelModal, confirmModal } from './modalStore.svelte';
	import CloseIcon from '@iconify-svelte/material-symbols/close';

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
	<div class="modal-box max-h-[85dvh] overflow-y-auto pt-0">
		<div
			class="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-2 bg-base-100 px-6 py-4"
		>
			{#if modal?.title}
				<h3 class="font-serif text-lg font-bold">{modal.title}</h3>
			{:else}
				<span></span>
			{/if}
			<button class="btn btn-circle btn-ghost btn-sm" onclick={cancelModal} aria-label="Close">
				<CloseIcon height="16" />
			</button>
		</div>
		{#if modal}
			{@render modal.content({ confirm: confirmModal, cancel: cancelModal })}
		{/if}
	</div>
</dialog>
