import { auth, User } from "@lib/auth";
import { db } from "@lib/db";
import { tenant, tenantRequest } from "@lib/db/schema/tenancy";
import { assertPermission } from "@lib/permissions/helpers";
import { user as authSchemaUser } from "@lib/db/schema/auth-schema";
import {
	and,
	asc,
	desc,
	count,
	eq,
	ilike,
	type SQL,
	getTableColumns,
	sql,
} from "drizzle-orm";
import { escapeLikePattern } from "@lib/utils";
import { alias } from "drizzle-orm/pg-core";
import { ApiError, UnexpectedError } from "@lib/errors";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;
const requestor = alias(authSchemaUser, "requestor");
const reviewer = alias(authSchemaUser, "reviewer");

export async function handleCreateTenant(actor: User, name: string) {
	await assertPermission(actor.id, { tenants: ["create"] });

	try {
		const [newTenant] = await db
			.insert(tenant)
			.values({ name })
			.returning();
		if (newTenant) {
			return { tenant: newTenant };
		} else {
			throw new UnexpectedError();
		}
	} catch (e) {
		console.error(e);
		throw new UnexpectedError();
	}
}

export async function handleGetTenant(actor: User, tenantId: string) {
	await assertPermission(actor.id, { tenants: ["get"] });

	try {
		const [tenantRow] = await db
			.select()
			.from(tenant)
			.where(eq(tenant.id, tenantId))
			.limit(1);

		if (!tenantRow) {
			throw new ApiError(404, "Tenant not found");
		}
		const [stats] = await db
			.select({ totalUsers: sql<number>`count(*)::int` })
			.from(authSchemaUser)
			.where(eq(authSchemaUser.tenantId, tenantId));

		return {
			tenant: tenantRow,
			totalUsers: stats?.totalUsers ?? 0,
		};
	} catch (e) {
		console.error(e);
		throw new UnexpectedError();
	}
}

export async function handleListTenants(
	actor: User,
	params: {
		searchValue?: string;
		limit?: number;
		offset?: number;
		sortBy?: string;
		sortDirection?: "asc" | "desc";
	},
) {
	await assertPermission(actor.id, { tenants: ["list"] });

	const conditions: SQL[] = [];

	if (params.searchValue) {
		const pattern = `%${escapeLikePattern(params.searchValue)}%`;
		conditions.push(ilike(tenant.name, pattern));
	}

	const SORTABLE_TENANT_COLUMNS = getTableColumns(tenant);
	const sortColumn =
		params.sortBy && params.sortBy in SORTABLE_TENANT_COLUMNS
			? SORTABLE_TENANT_COLUMNS[
					params.sortBy as keyof typeof SORTABLE_TENANT_COLUMNS
				]
			: SORTABLE_TENANT_COLUMNS.createdAt;
	const orderBy =
		params.sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

	const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
	const offset = Math.max(params.offset ?? 0, 0);

	const whereClause = conditions.length ? and(...conditions) : undefined;

	try {
		const [tenants, totalResult] = await Promise.all([
			db
				.select()
				.from(tenant)
				.where(whereClause)
				.orderBy(orderBy)
				.limit(limit)
				.offset(offset),
			db.select({ total: count() }).from(tenant).where(whereClause),
		]);

		const total = totalResult[0]?.total ?? 0;
		return { tenants, total, limit, offset };
	} catch (e) {
		console.error(e);
		throw new UnexpectedError();
	}
}

export async function handleRequestTenancy(body: {
	fullName: string;
	email: string;
	password: string;
	orgName: string;
}) {
	const { fullName, email, password, orgName } = body;

	try {
		const existing = await db
			.select({ id: authSchemaUser.id })
			.from(authSchemaUser)
			.where(eq(authSchemaUser.email, email))
			.limit(1);

		if (existing.length > 0) {
			// do not reveal that the email is already registered
			throw new ApiError(400, "Unable to process request");
		}

		return await db.transaction(async (tx) => {
			const signUpResult = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: fullName,
				},
			});

			await tx
				.update(authSchemaUser)
				.set({ role: "requestor" })
				.where(eq(authSchemaUser.id, signUpResult.user.id));

			const [request] = await tx
				.insert(tenantRequest)
				.values({ requestedBy: signUpResult.user.id, name: orgName })
				.returning();

			if (!request) {
				throw new UnexpectedError();
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { reviewedBy, ...req } = request;

			// TODO send an email or notification of new request

			return { request: req };
		});
	} catch (e) {
		if (e instanceof ApiError) {
			throw e;
		}
		console.error(e);
		throw new ApiError(400, "Unable to process request");
	}
}

export async function handleListRequests(
	actor: User,
	params: {
		filter?: "pending" | "approved" | "rejected";
		searchValue?: string;
		limit?: number;
		offset?: number;
		sortBy?: string;
		sortDirection?: "asc" | "desc";
	},
) {
	await assertPermission(actor.id, { tenants: ["list"] });

	const conditions: SQL[] = [];

	if (params.filter) {
		conditions.push(eq(tenantRequest.status, params.filter));
	}

	if (params.searchValue) {
		const pattern = `%${escapeLikePattern(params.searchValue)}%`;
		conditions.push(ilike(tenantRequest.name, pattern));
	}

	const SORTABLE_REQUEST_COLUMNS = getTableColumns(tenantRequest);
	const sortColumn =
		params.sortBy && params.sortBy in SORTABLE_REQUEST_COLUMNS
			? SORTABLE_REQUEST_COLUMNS[
					params.sortBy as keyof typeof SORTABLE_REQUEST_COLUMNS
				]
			: SORTABLE_REQUEST_COLUMNS.createdAt;
	const orderBy =
		params.sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

	const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
	const offset = Math.max(params.offset ?? 0, 0);

	const whereClause = conditions.length ? and(...conditions) : undefined;

	try {
		const [requests, totalResult] = await Promise.all([
			db
				.select()
				.from(tenantRequest)
				.where(whereClause)
				.orderBy(orderBy)
				.limit(limit)
				.offset(offset),
			db
				.select({ total: count() })
				.from(tenantRequest)
				.where(whereClause),
		]);

		const total = totalResult[0]?.total ?? 0;
		return { requests, total, limit, offset };
	} catch (e) {
		console.error(e);
		throw new UnexpectedError();
	}
}

export async function handleAcceptRequest(actor: User, requestId: string) {
	await assertPermission(actor.id, { tenants: ["create"] });

	const [request] = await db
		.select()
		.from(tenantRequest)
		.where(eq(tenantRequest.id, requestId))
		.limit(1);

	if (!request) {
		throw new ApiError(404, "Request not found");
	}
	if (request.status !== "pending") {
		throw new ApiError(409, "Request has already been reviewed");
	}

	try {
		const result = await db.transaction(async (tx) => {
			const [newTenant] = await tx
				.insert(tenant)
				.values({ name: request.name })
				.returning();

			if (!newTenant) {
				tx.rollback();
				return null;
			}

			if (!request.requestedBy) {
				return null;
			}

			const [updatedUser] = await tx
				.update(authSchemaUser)
				.set({ tenantId: newTenant.id, role: "admin" })
				.where(eq(authSchemaUser.id, request.requestedBy))
				.returning();

			if (!updatedUser) {
				tx.rollback();
				return null;
			}

			const [updatedRequest] = await tx
				.update(tenantRequest)
				.set({
					status: "approved",
					reviewedBy: actor.id,
					reviewedAt: new Date(),
				})
				.where(eq(tenantRequest.id, requestId))
				.returning();

			if (!updatedRequest) {
				throw new UnexpectedError();
			}
			return {
				tenant: newTenant,
				user: updatedUser,
				request: {
					...updatedRequest,
					status: "approved" as const,
				},
			};
		});

		if (!result) {
			throw new UnexpectedError();
		}

		// TODO send an email to the requestor
		return result;
	} catch (e) {
		console.error(e);
		throw new UnexpectedError();
	}
}

export async function handleRejectRequest(
	actor: User,
	requestId: string,
	rejectionReason: string,
) {
	await assertPermission(actor.id, { tenants: ["create"] });

	const [request] = await db
		.select()
		.from(tenantRequest)
		.where(eq(tenantRequest.id, requestId))
		.limit(1);

	if (!request) {
		throw new ApiError(404, "Request not found");
	}
	if (request.status !== "pending") {
		throw new ApiError(409, "Request has already been reviewed");
	}

	try {
		const [updatedRequest] = await db
			.update(tenantRequest)
			.set({
				status: "rejected",
				reviewedBy: actor.id,
				reviewedAt: new Date(),
				rejectionReason,
			})
			.where(eq(tenantRequest.id, requestId))
			.returning();

		if (!updatedRequest) {
			throw new UnexpectedError();
		}

		//TODO send rejection email
		return {
			request: {
				...updatedRequest,
				status: "rejected" as const,
			},
		};
	} catch (e) {
		console.error(e);
		throw new UnexpectedError();
	}
}

export async function handleGetStats(actor: User) {
	await assertPermission(actor.id, { tenants: ["list"] });
	try {
		const [tenantStats] = await db
			.select({
				totalTenants: sql<number>`count(*)::int`,
				newTenantsLast30Days: sql<number>`count(*) filter (where ${tenant.createdAt} > now() - interval '30 days')::int`,
			})
			.from(tenant);

		const [userStats] = await db
			.select({
				totalUsers: sql<number>`count(*)::int`,
			})
			.from(authSchemaUser);

		const [requestStats] = await db
			.select({
				pendingRequests: sql<number>`count(*) filter (where ${tenantRequest.status} = 'pending')::int`,
			})
			.from(tenantRequest);

		return {
			totalUsers: userStats?.totalUsers ?? 0,
			totalTenants: tenantStats?.totalTenants ?? 0,
			newTenantsLast30Days: tenantStats?.newTenantsLast30Days ?? 0,
			pendingRequests: requestStats?.pendingRequests ?? 0,
		};
	} catch (e) {
		console.error(e);
		throw new UnexpectedError();
	}
}

export async function handleGetRequest(actor: User, requestId: string) {
	await assertPermission(actor.id, { tenants: ["get"] });
	try {
		const [row] = await db
			.select({
				id: tenantRequest.id,
				//requestedBy: tenantRequest.requestedBy,
				requestedBy: requestor.name,
				name: tenantRequest.name,
				status: tenantRequest.status,
				createdAt: tenantRequest.createdAt,
				updatedAt: tenantRequest.updatedAt,
				//reviewedBy: tenantRequest.reviewedBy,
				reviewedBy: reviewer.name,
				reviewedAt: tenantRequest.reviewedAt,
				rejectionReason: tenantRequest.rejectionReason,
			})
			.from(tenantRequest)
			.leftJoin(requestor, eq(tenantRequest.requestedBy, requestor.id))
			.leftJoin(reviewer, eq(tenantRequest.reviewedBy, reviewer.id))
			.where(eq(tenantRequest.id, requestId))
			.limit(1);

		if (!row) {
			throw new ApiError(404, "Request not found");
		}
		return { request: row };
	} catch (e) {
		console.error(e);
		throw new UnexpectedError();
	}
}
