#!/usr/bin/env bun
/// <reference types="@types/bun" />

const url = 'http://localhost:3000/health';

async function main() {
	try {
		// die after 5 seconds
		const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

		if (!response.ok) {
			process.exit(1);
		}
		process.exit(0);
	} catch {
		process.exit(1);
	}
}

main();
