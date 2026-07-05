import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { auth } from "./auth";
import { db } from "./db";
import { user } from "./db/schema/auth-schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

/**
 * Asserts that a value is neither null nor undefined.
 * @param val - The value to check.
 * @param message - Optional custom error message.
 * @throws {Error} If val is null or undefined.
 */
export function assertExists<T>(
	val: T,
	message: string = "Value is null or undefined",
): asserts val is NonNullable<T> {
	if (val == null) {
		throw new Error(message);
	}
}

export async function runMigrations() {
	const url = process.env.DATABASE_URL;
	assertExists(url, "DATABASE_URL env var is not set");

	const migrationsFolder =
		process.env.MIGRATIONS_FOLDER ??
		path.join(import.meta.dir, "../../drizzle");

	await migrate(db, { migrationsFolder });
}
// create a default admin account if not exist
export async function defaultAdmin() {
	// check if an admin exists
	const res = await db.$count(user, eq(user.role, "admin"));
	if (res > 0) {
		console.log("An admin account already exists.");
		return;
	}

	let defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL;
	let defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

	if (!defaultAdminEmail) {
		defaultAdminEmail = "admin@localhost.com";
		console.warn(
			`DEFAULT_ADMIN_EMAIL not set — using default: ${defaultAdminEmail}`,
		);
	}

	if (!defaultAdminPassword) {
		defaultAdminPassword = randomBytes(16).toString("hex");
		console.warn(
			`DEFAULT_ADMIN_PASSWORD not set — generated one-time password: ${defaultAdminPassword}`,
		);
		console.warn("Change this immediately after first login.");
	}

	const created = await auth.api.signUpEmail({
		body: {
			name: "admin",
			email: defaultAdminEmail,
			password: defaultAdminPassword,
		},
	});

	// TODO implement must change password
	await db
		.update(user)
		.set({ role: "admin" })
		.where(eq(user.id, created.user.id));

	console.log("Default admin account created successfully");
}
