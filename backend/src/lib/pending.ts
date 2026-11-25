export interface PendingSource {
	id: string;
	/** Returns the number of items needing attention. 0 hides the row. */
	count: () => Promise<number>;
	/** Text shown beside the count badge (no number in it). */
	label: (count: number) => string;
	href: string;
	action: string;
}

export async function getPendingWork(sources: PendingSource[]) {
	const results = await Promise.allSettled(
		sources.map(async (source) => ({
			source,
			count: await source.count(),
		})),
	);

	const items = [];
	for (const [i, result] of results.entries()) {
		if (result.status === "rejected") {
			// Drop this row only; the rest still render.
			console.error(
				`pending source "${sources[i]?.id}" failed`,
				result.reason,
			);
			continue;
		}
		const { source, count } = result.value;
		if (count <= 0) continue;
		items.push({
			id: source.id,
			count,
			label: source.label(count),
			href: source.href,
			action: source.action,
		});
	}

	return items;
}
