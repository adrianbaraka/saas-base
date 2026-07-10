import type { BetterAuthSession } from '$lib';
import type { authClient } from '$lib/auth-client';

declare global {
	namespace App {
		interface Locals {
			session: BetterAuthSession | null;
			backendFetch: (path: string, init?: RequestInit) => Promise<Response>;
		}
	}
}

export {};

// // See https://svelte.dev/docs/kit/types#app.d.ts
// // for information about these interfaces
// declare global {
// 	namespace App {
// 		// interface Error {}
// 		// interface Locals {}
// 		// interface PageData {}
// 		// interface PageState {}
// 		// interface Platform {}
// 	}
// }

// export {};
