import type { BetterAuthSession, OrganizationsResponse } from '#lib/interfaces.ts';
declare global {
	namespace App {
		interface Locals {
			session: BetterAuthSession | null;
			backendFetch: (path: string, init?: RequestInit) => Promise<Response>;
			orgs: OrganizationsResponse | null;
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
