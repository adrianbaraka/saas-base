import { getJson } from '#lib/utils.ts';

export interface PendingItem {
	id: string;
	count: number;
	label: string;
	href: string;
	action: string;
}

export function getPending(locals: App.Locals, path: string): Promise<PendingItem[] | null> {
	return getJson<PendingItem[]>(locals, path, 'Failed to load pending work').catch((e) => {
		console.error('pending work failed', e);
		return null;
	});
}
