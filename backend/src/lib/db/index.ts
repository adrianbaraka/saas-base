import { env } from "@lib/env";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { authRelations } from "./schema/auth-schema";

export const db = drizzle(env.DATABASE_URL, {
	relations: {
		...authRelations,
	},
});

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;
