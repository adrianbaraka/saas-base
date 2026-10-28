import type { ToastType } from '#lib';

type ToastItem = {
	id: number;
	message: string;
	type: ToastType;
	duration?: number;
};

let toasts = $state<ToastItem[]>([]);
let nextId = 0;

export function showToast(message: string, type: ToastType, duration?: number) {
	const id = nextId++;
	const needsFallback = (type === 'error' || type === 'warning') && !message?.trim();
	const resolvedMessage = needsFallback ? 'An error occurred' : message;
	const resolvedDuration = duration ?? (type === 'success' ? 5000 : undefined);
	toasts.push({ id, message: resolvedMessage, type, duration: resolvedDuration });
}

export function dismissToast(id: number) {
	toasts = toasts.filter((t) => t.id !== id);
}

export function getToasts() {
	return toasts;
}
