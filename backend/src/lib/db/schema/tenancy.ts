import { nanoid } from "nanoid";
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const tenant = pgTable("tenant", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});
// in user table
// tenantId: text("tenant_id")
// 	.notNull()
// 	.references(() => tenant.id, { onDelete: "restrict" }),

export const statusEnum = pgEnum("status", ["pending", "approved", "rejected"]);

export const tenantRequest = pgTable("tenant_request", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	requestedBy: text("requested_by").references(() => user.id, {
		onDelete: "set null",
	}),
	name: text("name").notNull(),
	status: statusEnum("status").default("pending").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	reviewedBy: text("reviewed_by").references(() => user.id, {
		onDelete: "set null",
	}),
	reviewedAt: timestamp("reviewed_at"),
	rejectionReason: text("rejection_reason"),
});
