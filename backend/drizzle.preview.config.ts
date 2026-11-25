import "dotenv/config";
import { env } from "@lib/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./.drizzle-preview",
	schema: "./src/lib/db/schema/*",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
