import { db } from ".";
import { user as authSchemaUser } from "./schema/auth-schema";
import { eq } from "drizzle-orm";

export async function markEmailVerified(id: string, emailVerified: boolean) {
	if (emailVerified) {
		return;
	}
	await db
		.update(authSchemaUser)
		.set({
			emailVerified: true,
		})
		.where(eq(authSchemaUser.id, id));
}
