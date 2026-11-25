import { Scope, SCOPES } from "@lib/audit";
import { User } from "@lib/auth";
import { db } from "@lib/db";
import { activities } from "@lib/db/schema/activities";
import { ApiError, ForbiddenError } from "@lib/errors";
import { assertOrgPermission } from "@lib/security/helpers";
import { desc, eq, inArray, isNull, sql, SQL, and } from "drizzle-orm";
import { t } from "elysia";

export const activityQuerySchema = t.Object({
	module: t.Optional(t.String({ maxLength: 50 })),
	includeLow: t.Optional(t.BooleanString()), // default: low-priority rows hidden
	cursor: t.Optional(t.String({ maxLength: 200 })),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
});

export type ActivityQuery = {
	module?: string;
	includeLow?: boolean; // default: hide low-priority rows
	cursor?: string;
	limit?: number;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function encodeCursor(row: { createdAt: Date; id: string }) {
	return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`).toString(
		"base64url",
	);
}

function decodeCursor(cursor: string) {
	const [iso, id] = Buffer.from(cursor, "base64url").toString().split("|");
	const date = new Date(iso ?? "");
	if (!id || !UUID.test(id) || Number.isNaN(date.getTime())) {
		throw new ApiError(400, "Invalid cursor");
	}
	return { iso: date.toISOString(), id };
}

// scopeFilter pins the rows to the caller's scope; the module list is
// always restricted to the scope too, even when no module is requested.
async function listActivities(
	scope: Scope,
	scopeFilter: SQL,
	query: ActivityQuery,
) {
	const scopeModules: string[] = [...SCOPES[scope]];
	if (query.module && !scopeModules.includes(query.module)) {
		throw new ApiError(400, "Unknown module");
	}
	const limit = Math.min(
		Math.max(query.limit ?? DEFAULT_LIMIT, 1),
		MAX_LIMIT,
	);

	const conditions: (SQL | undefined)[] = [
		scopeFilter,
		inArray(
			activities.module,
			query.module ? [query.module] : scopeModules,
		),
	];
	if (!query.includeLow) {
		conditions.push(inArray(activities.level, ["normal", "high"]));
	}
	if (query.cursor) {
		const c = decodeCursor(query.cursor);
		conditions.push(
			sql`(${activities.createdAt}, ${activities.id}) < (${c.iso}::timestamptz, ${c.id}::uuid)`,
		);
	}

	// one extra row tells us whether there is a next page
	const rows = await db
		.select()
		.from(activities)
		.where(and(...conditions))
		.orderBy(desc(activities.createdAt), desc(activities.id))
		.limit(limit + 1);

	const hasMore = rows.length > limit;
	const items = hasMore ? rows.slice(0, limit) : rows;
	const last = items.at(-1);
	return { items, nextCursor: hasMore && last ? encodeCursor(last) : null };
}

export function listPlatformActivitiesHandler(
	actor: User,
	query: ActivityQuery,
) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}
	return listActivities("platform", isNull(activities.organizationId), query);
}

export async function listOrgActivitiesHandler(
	headers: Headers,
	organizationId: string,
	query: ActivityQuery,
) {
	await assertOrgPermission(headers, organizationId, { activity: ["read"] });
	return listActivities(
		"organization",
		eq(activities.organizationId, organizationId),
		query,
	);
}
