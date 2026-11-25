import { logQuiet } from "@lib/audit";
import { User } from "@lib/auth";
import { db } from "@lib/db";
import {
	user as authSchemaUser,
	member,
	organization,
} from "@lib/db/schema/auth-schema";
import { orgRequest } from "@lib/db/schema/orgs";
import { welcomeEmail } from "@lib/email";
import { WelcomeContext } from "@lib/email/templates/welcome";
import { env } from "@lib/env";
import { ApiError, ForbiddenError, NotFoundError } from "@lib/errors";
import { getPendingWork, PendingSource } from "@lib/pending";
import {
	createPasswordlessUser,
	issueSetPasswordLink,
	resolveAccountState,
} from "@lib/services/users.services";
import {
	and,
	asc,
	count,
	desc,
	eq,
	getColumns,
	ilike,
	isNull,
	not,
	notExists,
	or,
	sql,
	SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// in list users the columns that one can sort are the ones defined in the db
// limit to a max of 200 users at once and default to 100
const SORTABLE_COLUMNS = getColumns(authSchemaUser);
export const MAX_LIMIT = 200;
export const DEFAULT_LIMIT = 100;

const reviewer = alias(authSchemaUser, "reviewer");
const creator = alias(authSchemaUser, "creator");

export async function listPlatformAdminsHandler(
	actor: User,
	params: {
		searchValue?: string;
		emailVerified?: boolean;
		limit?: number;
		offset?: number;
		sortBy?: string;
		sortDirection?: "asc" | "desc";
	},
) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const conditions: SQL[] = [eq(authSchemaUser.isPlatformAdmin, true)];

	if (params.searchValue) {
		const pattern = `%${params.searchValue}%`;
		conditions.push(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			or(
				ilike(authSchemaUser.name, pattern),
				ilike(authSchemaUser.email, pattern),
			)!,
		);
	}

	if (params.emailVerified !== undefined) {
		conditions.push(eq(authSchemaUser.emailVerified, params.emailVerified));
	}

	const sortColumn =
		params.sortBy && params.sortBy in SORTABLE_COLUMNS
			? SORTABLE_COLUMNS[params.sortBy as keyof typeof SORTABLE_COLUMNS]
			: SORTABLE_COLUMNS.createdAt;
	const orderBy =
		params.sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

	const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
	const offset = Math.max(params.offset ?? 0, 0);

	const whereClause = and(...conditions);

	const [users, totalResult] = await Promise.all([
		db
			.select()
			.from(authSchemaUser)
			.where(whereClause)
			.orderBy(orderBy)
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(authSchemaUser).where(whereClause),
	]);

	const total = totalResult[0]?.total ?? 0;
	return { users, total, limit, offset };
}

export async function getPlatformAdminHandler(actor: User, id: string) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const [admin] = await db
		.select()
		.from(authSchemaUser)
		.where(
			and(
				eq(authSchemaUser.id, id),
				eq(authSchemaUser.isPlatformAdmin, true),
			),
		)
		.limit(1);

	if (!admin) {
		throw new NotFoundError();
	}

	return admin;
}

const PLATFORM_ADMIN_WELCOME = { kind: "platform-admin" } as const;

export async function createPlatformAdminHandler(
	actor: User,
	body: { email: string; name: string },
) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	let state = await resolveAccountState(body.email);

	if (state.kind === "none") {
		const created = await createPasswordlessUser({
			email: body.email,
			name: body.name,
			isPlatformAdmin: true, // set here, never from the body
		});

		if (created) {
			await logQuiet(db, {
				module: "platform",
				action: "platform_admin.created",
				description: `${actor.name} created platform admin ${body.name}`,
				actorId: actor.id,
				metadata: { entityType: "user", ids: [created.id], count: 1 },
			});
			await issueSetPasswordLink(
				created,
				`${env.BETTER_AUTH_URL}/welcome`,
				async (url) =>
					(await welcomeEmail(
						created,
						url,
						PLATFORM_ADMIN_WELCOME,
					)) !== false,
			);
			return { success: true };
		}

		// lost a race: this email was created a moment ago, so re-evaluate
		state = await resolveAccountState(body.email);
	}

	// an existing regular user is never promoted from here
	if (state.kind === "none" || !state.user.isPlatformAdmin) {
		throw new ApiError(
			409,
			"Cannot create a platform admin for this email",
		);
	}

	// already a platform admin who finished setup: nothing to send
	if (state.kind === "complete") {
		return { success: true };
	}

	// pending platform admin: resend (the cooldown applies)
	const pending = state.user;
	await issueSetPasswordLink(
		pending,
		`${env.BETTER_AUTH_URL}/welcome`,
		async (url) =>
			(await welcomeEmail(pending, url, PLATFORM_ADMIN_WELCOME)) !==
			false,
	);
	return { success: true };
}

// Name of an org this user owns (most recently joined first), or null.
// Better Auth stores multiple roles as a comma-separated string.
async function findOwnedOrgName(userId: string): Promise<string | null> {
	const rows = await db
		.select({ role: member.role, organizationName: organization.name })
		.from(member)
		.innerJoin(organization, eq(organization.id, member.organizationId))
		.where(eq(member.userId, userId))
		.orderBy(desc(member.createdAt));

	const owned = rows.find((r) =>
		r.role
			.split(",")
			.map((s) => s.trim())
			.includes("owner"),
	);
	return owned?.organizationName ?? null;
}

export async function resendPlatformWelcomeHandler(
	actor: User,
	body: { email: string },
) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const state = await resolveAccountState(body.email);
	if (state.kind === "none") {
		throw new ApiError(404, "User not found");
	}

	const target = state.user;

	// platform admins may only resend to platform admins and org owners;
	// anyone else looks the same as a user that doesn't exist
	let context: WelcomeContext;
	if (target.isPlatformAdmin) {
		context = { kind: "platform-admin" };
	} else {
		const organizationName = await findOwnedOrgName(target.id);
		if (organizationName === null) {
			throw new ApiError(404, "User not found");
		}
		context = { kind: "org-owner", organizationName };
	}

	// the issuer rejects completed accounts (400), applies the cooldown (409),
	// and rolls everything back if the email fails (502)
	await issueSetPasswordLink(
		target,
		`${env.BETTER_AUTH_URL}/welcome`,
		async (url) => (await welcomeEmail(target, url, context)) !== false,
	);

	return { success: true };
}

// roles are stored comma-separated; this matches "owner" as a whole role
const OWNER_ROLE_PATTERN = "(^|,)\\s*owner\\s*(,|$)";

function selectOwners(organizationFilter?: SQL) {
	return db
		.select({
			organizationId: member.organizationId,
			id: authSchemaUser.id,
			name: authSchemaUser.name,
			email: authSchemaUser.email,
			emailVerified: authSchemaUser.emailVerified,
		})
		.from(member)
		.innerJoin(authSchemaUser, eq(authSchemaUser.id, member.userId))
		.where(
			and(
				sql`${member.role} ~ ${OWNER_ROLE_PATTERN}`,
				organizationFilter,
			),
		);
}

function toOwner(o: {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
}) {
	// setupComplete = false means the owner still has to set a password
	return {
		id: o.id,
		name: o.name,
		email: o.email,
		setupComplete: o.emailVerified,
	};
}

export async function listOrganizationsHandler(actor: User) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const [orgs, counts, owners] = await Promise.all([
		db.select().from(organization).orderBy(desc(organization.createdAt)),
		db
			.select({ organizationId: member.organizationId, total: count() })
			.from(member)
			.groupBy(member.organizationId),
		selectOwners(),
	]);

	const countByOrg = new Map(counts.map((c) => [c.organizationId, c.total]));
	const ownersByOrg = new Map<string, ReturnType<typeof toOwner>[]>();
	for (const o of owners) {
		const list = ownersByOrg.get(o.organizationId) ?? [];
		list.push(toOwner(o));
		ownersByOrg.set(o.organizationId, list);
	}

	return {
		organizations: orgs.map((org) => ({
			...org,
			memberCount: countByOrg.get(org.id) ?? 0,
			owners: ownersByOrg.get(org.id) ?? [],
		})),
	};
}

export async function getOrganizationHandler(actor: User, id: string) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const [org] = await db
		.select()
		.from(organization)
		.where(eq(organization.id, id))
		.limit(1);
	if (!org) {
		throw new ApiError(404, "Organization not found");
	}

	const [owners, originRows, countRows] = await Promise.all([
		selectOwners(eq(member.organizationId, id)),
		// how the org came to exist; empty for orgs created some other way
		db
			.select({
				id: orgRequest.id,
				createdAt: orgRequest.createdAt,
				createdBy: orgRequest.createdBy,
				createdByName: creator.name,
				reviewedBy: orgRequest.reviewedBy,
				reviewedByName: reviewer.name,
				reviewedAt: orgRequest.reviewedAt,
			})
			.from(orgRequest)
			.leftJoin(creator, eq(creator.id, orgRequest.createdBy))
			.leftJoin(reviewer, eq(reviewer.id, orgRequest.reviewedBy))
			.where(eq(orgRequest.createdOrganizationId, id))
			.limit(1),
		db
			.select({ total: count() })
			.from(member)
			.where(eq(member.organizationId, id)),
	]);

	return {
		...org,
		memberCount: countRows[0]?.total ?? 0,
		owners: owners.map(toOwner),
		request: originRows[0] ?? null,
	};
}

// accounts that belong to nothing: not a platform admin and not in any org
function limboCondition() {
	return (
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		and(
			or(
				isNull(authSchemaUser.isPlatformAdmin),
				eq(authSchemaUser.isPlatformAdmin, false),
			),
			notExists(
				db
					.select({ one: sql`1` })
					.from(member)
					.where(eq(member.userId, authSchemaUser.id)),
			),
		)!
	);
}
export async function getPlatformStatsHandler(actor: User) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const [
		totalOrganizations,
		totalUsers,
		totalPlatformAdmins,
		pendingRequests,
		limboAccounts,
	] = await Promise.all([
		db.$count(organization),
		db.$count(authSchemaUser, not(limboCondition())),
		db.$count(authSchemaUser, eq(authSchemaUser.isPlatformAdmin, true)),
		db.$count(orgRequest, eq(orgRequest.status, "pending")),
		db.$count(authSchemaUser, limboCondition()),
	]);

	return {
		totalOrganizations,
		totalUsers,
		totalPlatformAdmins,
		pendingRequests,
		limboAccounts,
	};
}

export async function getPendingWorkHandler(actor: User) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const pendingSources: PendingSource[] = [
		{
			id: "requests",
			count: () =>
				db.$count(orgRequest, eq(orgRequest.status, "pending")),
			label: (n) =>
				n === 1
					? "request awaiting review"
					: "requests awaiting review",
			href: "/platform-admin/requests",
			action: "Review",
		},
	];

	return getPendingWork(pendingSources);
}
