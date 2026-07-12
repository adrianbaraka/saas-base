import type { Snippet } from 'svelte';

type ModalContent = Snippet<[{ confirm: () => void; cancel: () => void }]>;

type ModalState = {
	title?: string;
	content: ModalContent;
	resolver: (confirmed: boolean) => void;
} | null;

let modal = $state<ModalState>(null);

export function getModal() {
	return modal;
}

export function openModal(options: { title?: string; content: ModalContent }): Promise<boolean> {
	// cannot have 2 modals at once
	if (modal) {
		return Promise.reject(new Error('A modal is already open'));
	}

	return new Promise((resolve) => {
		modal = {
			title: options.title,
			content: options.content,
			resolver: resolve
		};
	});
}

export function confirmModal() {
	modal?.resolver(true);
	modal = null;
}

export function cancelModal() {
	modal?.resolver(false);
	modal = null;
}
