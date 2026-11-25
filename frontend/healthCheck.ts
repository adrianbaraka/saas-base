#!/usr/bin/env bun
/// <reference types="@types/bun" />

const url = 'http://localhost:3000/health';

const headers: Record<string, string> = {};

// Mimic a proxy so SvelteKit's getClientAddress() doesn't throw.
const addressHeader = process.env.ADDRESS_HEADER;
if (addressHeader) {
	const depth = Math.max(Number(process.env.XFF_DEPTH ?? 1), 1);
	// X-Forwarded-For is read from the right, so we need at least `depth` entries.
	headers[addressHeader] = Array(depth).fill('127.0.0.1').join(', ');
}

async function main() {
	try {
		// die after 5 seconds
		const response = await fetch(url, {
			headers,
			signal: AbortSignal.timeout(5000)
		});

		process.exit(response.ok ? 0 : 1);
	} catch {
		process.exit(1);
	}
}

main();
