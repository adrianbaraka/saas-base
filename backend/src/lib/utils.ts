import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { db } from "./db";
import { user } from "./db/schema/auth-schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendWelcomeEmail } from "@routes/v1/users/users.handlers";
import { env } from "./env";

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
	const url = env.DATABASE_URL;
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

	// manually create the first admin user
	const [created] = await db
		.insert(user)
		.values({
			id: nanoid(),
			name: env.DEFAULT_ADMIN_NAME,
			email: env.DEFAULT_ADMIN_EMAIL,
			emailVerified: false,
			role: "admin",
		})
		.returning();

	if (!created) {
		console.error("An error occurred creating the default admin user.");
		process.exit(1);
	}
	const redirectTo = `${env.BETTER_AUTH_URL}/welcome`;
	try {
		await sendWelcomeEmail(created.id, created.email, redirectTo);
		console.log("Default admin account created successfully");
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}
