import { goto } from '$app/navigation';
import { page } from '$app/state';

export interface TableUrlStateInit {
	filters?: Record<string, string | string[]>;
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
	filters = $state<Record<string, string[]>>({});
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

		if (init.filters !== undefined) {
			this.filters = Object.fromEntries(
				Object.entries(init.filters).map(([key, value]) => [
					key,
					Array.isArray(value) ? value : [value]
				])
			);
		}

		if (init.limit !== undefined) this.limit = init.limit;
		if (init.offset !== undefined) this.offset = init.offset;
		if (init.sortBy !== undefined) this.sortBy = init.sortBy;
		if (init.sortDirection !== undefined) {
			this.sortDirection = init.sortDirection;
		}
	}

	private navigate(updates: Record<string, string | string[]>) {
		const params = new URLSearchParams(page.url.searchParams.toString());

		for (const [key, value] of Object.entries(updates)) {
			params.delete(key);

			if (Array.isArray(value)) {
				for (const item of value) {
					if (item !== '') {
						params.append(key, item);
					}
				}
			} else if (value !== '') {
				params.set(key, value);
			}
		}

		goto(`?${params}`);
	}

	/** Navigate to a 1-indexed page number. */
	goToPage(pageNumber: number) {
		this.navigate({
			offset: String((pageNumber - 1) * this.limit)
		});
	}

	/** Submit the current `search` value, resetting to page 1. */
	submitSearch() {
		this.navigate({
			search: this.search,
			offset: '0'
		});
	}

	/** Apply a single or multi-value filter immediately, resetting to page 1. */
	setFilter(key: string, value: string | string[]) {
		const values = Array.isArray(value) ? value : [value];

		this.filters = {
			...this.filters,
			[key]: values
		};

		this.navigate({
			[key]: values,
			offset: '0'
		});
	}
	/** Apply multiple filters atomically in one navigation, resetting to page 1. */
	setFilters(updates: Record<string, string | string[]>) {
		this.filters = {
			...this.filters,
			...Object.fromEntries(
				Object.entries(updates).map(([key, value]) => [key, Array.isArray(value) ? value : [value]])
			)
		};

		this.navigate({
			...updates,
			offset: '0'
		});
	}

	getFilter(key: string, fallback = ''): string {
		return this.filters[key]?.[0] ?? fallback;
	}

	/** Clear a filter immediately, resetting to page 1. */
	clearFilter(key: string) {
		this.filters = {
			...this.filters,
			[key]: []
		};

		this.navigate({
			[key]: [],
			offset: '0'
		});
	}

	/** Clear every active filter at once, resetting to page 1. One
	 * navigation rather than one per filter, which is what calling
	 * `clearFilter` in a loop would cost. */
	clearFilters() {
		const keys = Object.keys(this.filters);
		if (keys.length === 0) return;

		this.filters = {};
		this.navigate({
			...Object.fromEntries(keys.map((key) => [key, [] as string[]])),
			offset: '0'
		});
	}

	/** Apply a new page size, resetting to page 1. */
	changeLimit(newLimit: number) {
		this.navigate({
			limit: String(newLimit),
			offset: '0'
		});
	}

	/** Toggle sort on a column: new column -> asc, same column -> flip. */
	toggleSort(column: string) {
		const nextDirection = this.sortBy === column && this.sortDirection === 'asc' ? 'desc' : 'asc';

		this.navigate({
			sortBy: column,
			sortDirection: nextDirection,
			offset: '0'
		});
	}

	/** Sort state for a column header. */
	sortState(column: string): 'none' | 'asc' | 'desc' {
		if (this.sortBy !== column) return 'none';

		return this.sortDirection === 'asc' ? 'asc' : 'desc';
	}
}
