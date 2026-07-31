import { goto } from '$app/navigation';
import { page } from '$app/state';

export interface TableUrlStateInit {
	filter?: string;
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: string;
	sortDirection?: 'asc' | 'desc' | string;
}

const SEARCH_DEBOUNCE_MS = 700;
const SEARCH_MIN_LENGTH = 3;

export class TableUrlState {
	search = $state('');
	filter = $state('');
	limit = $state(20);
	offset = $state(0);
	sortBy = $state('createdAt');
	sortDirection = $state('desc');

	#searchEffectPrimed = false;

	constructor(init: TableUrlStateInit = {}) {
		this.sync(init);

		$effect(() => {
			const value = this.search;

			if (!this.#searchEffectPrimed) {
				this.#searchEffectPrimed = true;
				return;
			}

			if (value.length > 0 && value.length < SEARCH_MIN_LENGTH) return;

			const timeout = setTimeout(() => this.submitSearch(), SEARCH_DEBOUNCE_MS);
			return () => clearTimeout(timeout);
		});
	}

	/** Re-sync all fields from a fresh `data` object (e.g. after navigation). */
	sync(init: TableUrlStateInit) {
		if (init.search !== undefined) this.search = init.search;
		if (init.filter !== undefined) this.filter = init.filter;
		if (init.limit !== undefined) this.limit = init.limit;
		if (init.offset !== undefined) this.offset = init.offset;
		if (init.sortBy !== undefined) this.sortBy = init.sortBy;
		if (init.sortDirection !== undefined) this.sortDirection = init.sortDirection;
	}

	private navigate(updates: Record<string, string>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(updates)) {
			if (value === '') {
				params.delete(key);
			} else {
				params.set(key, value);
			}
		}
		goto(`?${params}`);
	}

	/** Navigate to a 1-indexed page number. */
	goToPage(pageNumber: number) {
		this.navigate({ offset: String((pageNumber - 1) * this.limit) });
	}

	/** Submit the current `search` value, resetting to page 1. */
	submitSearch() {
		this.navigate({ search: this.search, offset: '0' });
	}

	/** Apply a new status filter immediately, resetting to page 1. */
	submitFilter(newFilter: string) {
		this.filter = newFilter;
		this.navigate({ filter: newFilter, offset: '0' });
	}

	/** Apply a new page size, resetting to page 1. */
	changeLimit(newLimit: number) {
		this.navigate({ limit: String(newLimit), offset: '0' });
	}

	/** Toggle sort on a column: new column -> asc, same column -> flip. */
	toggleSort(column: string) {
		const nextDirection = this.sortBy === column && this.sortDirection === 'asc' ? 'desc' : 'asc';
		this.navigate({ sortBy: column, sortDirection: nextDirection, offset: '0' });
	}

	/** Sort indicator for a column header. */
	arrow(column: string): '↕' | '↑' | '↓' {
		if (this.sortBy !== column) return '↕';
		return this.sortDirection === 'asc' ? '↑' : '↓';
	}
}
