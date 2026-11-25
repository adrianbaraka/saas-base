import { sql } from "drizzle-orm";
import {
	pgTable,
	pgEnum,
	uuid,
	text,
	timestamp,
	jsonb,
	index,
} from "drizzle-orm/pg-core";

export const activityLevel = pgEnum("activity_level", [
	"low",
	"normal",
	"high",
]);

export type ActivityMetadata = {
	entityType?: string;
	ids?: string[];
	count?: number;
	[key: string]: unknown;
};

export const activities = pgTable(
	"activities",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),

		// No FKs on purpose: the log must survive organization/user deletion.
		// Nullable: auth events may happen before an organization is active.
		organizationId: text("organization_id"),
		// Null = system action (cron, webhook).
		actorId: text("actor_id"),

		module: text("module").notNull(), // 'members', 'auth'
		action: text("action").notNull(), // 'member.role_changed' (stable key)
		description: text("description").notNull(), // display text
		level: activityLevel("level").notNull().default("normal"),

		metadata: jsonb("metadata").$type<ActivityMetadata>(),
	},
	(t) => [
		// main feed
		index("activities_org_created_idx").on(
			t.organizationId,
			t.createdAt.desc(),
		),
		// feed filtered by module
		index("activities_org_module_created_idx").on(
			t.organizationId,
			t.module,
			t.createdAt.desc(),
		),
		// cleanup job for low-priority rows
		index("activities_low_cleanup_idx")
			.on(t.createdAt)
			.where(sql`${t.level} = 'low'`),
	],
);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
