import type { ToastType } from '$lib';

type ToastItem = {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
};

let toasts = $state<ToastItem[]>([]);
let nextId = 0;

export function showToast(message: string, type: ToastType, duration?: number) {
	const id = nextId++;
	const resolvedDuration = duration ?? (type === 'error' ? 5000 : 2500);
	toasts.push({ id, message, type, duration: resolvedDuration });
}

export function dismissToast(id: number) {
	toasts = toasts.filter((t) => t.id !== id);
}

export function getToasts() {
	return toasts;
}
