import { sql } from "drizzle-orm";
import {
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";

export const orgRequestStatus = pgEnum("org_request_status", [
	"pending",
	"approving",
	"approved",
	"rejected",
]);

export const orgRequest = pgTable(
	"org_request",
	{
		id: text("id").primaryKey(),

		// what the requester submitted
		requesterName: text("requester_name").notNull(),
		email: text("email").notNull(), // stored normalized: trimmed, lowercase
		organizationName: text("organization_name").notNull(),

		status: orgRequestStatus("status").default("pending").notNull(),

		// review
		reviewedBy: text("reviewed_by").references(() => user.id, {
			onDelete: "set null",
		}),
		reviewedAt: timestamp("reviewed_at"),
		rejectionReason: text("rejection_reason"),

		// recorded during approval so a retry resumes instead of duplicating
		ownerUserId: text("owner_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		createdOrganizationId: text("created_organization_id").references(
			() => organization.id,
			{ onDelete: "set null" },
		),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		// the review queue: filter by status, oldest first
		index("org_request_status_created_idx").on(
			table.status,
			table.createdAt,
		),
		// at most one open request per email
		uniqueIndex("org_request_open_email_idx")
			.on(table.email)
			.where(sql`${table.status} in ('pending', 'approving')`),
	],
);

export type OrgRequest = typeof orgRequest.$inferSelect;
