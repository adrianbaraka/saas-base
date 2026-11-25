import { env } from "./env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { db } from "./db";
import Elysia from "elysia";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function assertExists<T>(
	val: T,
	message: string = "Value is null or undefined",
): asserts val is NonNullable<T> {
	if (val == null) {
		throw new Error(message);
	}
}

export async function runMigrations() {
	const url = env.DATABASE_URL;
	assertExists(url, "DATABASE_URL env var is not set");
	const migrationsFolder =
		// for prod migrations folder is specified
		process.env.MIGRATIONS_FOLDER ??
		path.join(import.meta.dir, "../../drizzle");

	await migrate(db, { migrationsFolder });
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const csrf = (opts: {
	trustedOrigins: string[];
	skipPaths?: string[];
}) =>
	new Elysia({ name: "csrf" }).onRequest(({ request, set }) => {
		//console.log(request);

		if (!MUTATING.has(request.method)) return;

		const { pathname } = new URL(request.url);
		if (opts.skipPaths?.some((p) => pathname.startsWith(p))) return;

		const origin = request.headers.get("origin");
		if (origin && opts.trustedOrigins.includes(origin)) return;

		set.status = 403;
		return { message: "Forbidden: untrusted origin" };
	});
