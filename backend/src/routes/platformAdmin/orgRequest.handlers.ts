import { db } from "@lib/db";
import { orgRequest, OrgRequest } from "@lib/db/schema/orgs";
import { ApiError, ForbiddenError } from "@lib/errors";
import {
	AccountState,
	createPasswordlessUser,
	issueSetPasswordLink,
	normalizeEmail,
	resolveAccountState,
} from "@lib/services/users.services";
import {
	getColumns,
	eq,
	or,
	ilike,
	asc,
	desc,
	and,
	count,
	SQL,
	lt,
} from "drizzle-orm";
import { DEFAULT_LIMIT, MAX_LIMIT } from "./platform.handlers";
import { nanoid } from "nanoid";
import { auth, User } from "@lib/auth";
import { orgRequestRejectedEmail, welcomeEmail } from "@lib/email";
import { createHash } from "node:crypto";
import { member, organization, user } from "@lib/db/schema/auth-schema";
import { orgApprovedNoticeEmail } from "@lib/email/templates/org-aproval";
import { env } from "@lib/env";
import { alias } from "drizzle-orm/pg-core";
import { logQuiet } from "@lib/audit";
export const WELCOME_REDIRECT = `${env.BETTER_AUTH_URL}/welcome`;
export async function submitOrgRequestHandler(body: {
	requesterName: string;
	email: string;
	organizationName: string;
}) {
	const requesterName = body.requesterName.trim();
	const organizationName = body.organizationName.trim();
	if (!requesterName || !organizationName) {
		throw new ApiError(400, "Name and organization name are required");
	}

	// a second open request for the same email hits the partial unique index
	// and is skipped; the caller gets the same response either way
	await db
		.insert(orgRequest)
		.values({
			id: nanoid(),
			requesterName,
			email: normalizeEmail(body.email),
			organizationName,
		})
		.onConflictDoNothing();

	return { success: true };
}

const SORTABLE_REQUEST_COLUMNS = getColumns(orgRequest);
export const requestCreator = alias(user, "creator");
export const requestReviewer = alias(user, "reviewer");

export async function listOrgRequestsHandler(
	actor: User,
	params: {
		searchValue?: string;
		status?: OrgRequest["status"];
		limit?: number;
		offset?: number;
		sortBy?: string;
		sortDirection?: "asc" | "desc";
	},
) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const conditions: SQL[] = [];

	// no default: without a status filter, every status is returned
	if (params.status) {
		conditions.push(eq(orgRequest.status, params.status));
	}

	if (params.searchValue) {
		const pattern = `%${params.searchValue}%`;
		conditions.push(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			or(
				ilike(orgRequest.requesterName, pattern),
				ilike(orgRequest.email, pattern),
				ilike(orgRequest.organizationName, pattern),
			)!,
		);
	}

	const sortColumn =
		params.sortBy && Object.hasOwn(SORTABLE_REQUEST_COLUMNS, params.sortBy)
			? SORTABLE_REQUEST_COLUMNS[
					params.sortBy as keyof typeof SORTABLE_REQUEST_COLUMNS
				]
			: SORTABLE_REQUEST_COLUMNS.createdAt;
	const orderBy =
		params.sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

	const limit = Math.min(
		Math.max(params.limit ?? DEFAULT_LIMIT, 1),
		MAX_LIMIT,
	);
	const offset = Math.max(params.offset ?? 0, 0);

	// and() with no conditions returns undefined, which means "no filter"
	const whereClause = and(...conditions);

	const [requests, totalResult] = await Promise.all([
		db
			.select({
				...getColumns(orgRequest),
				createdByName: requestCreator.name,
				reviewedByName: requestReviewer.name,
			})
			.from(orgRequest)
			.leftJoin(
				requestCreator,
				eq(requestCreator.id, orgRequest.createdBy),
			)
			.leftJoin(
				requestReviewer,
				eq(requestReviewer.id, orgRequest.reviewedBy),
			)
			.where(whereClause)
			.orderBy(orderBy)
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(orgRequest).where(whereClause),
	]);

	const total = totalResult[0]?.total ?? 0;
	return { requests, total, limit, offset };
}

export async function rejectOrgRequestHandler(
	actor: User,
	id: string,
	reason?: string,
) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	// atomic claim: only a pending request can be rejected, and only once
	const [rejected] = await db
		.update(orgRequest)
		.set({
			status: "rejected",
			reviewedBy: actor.id,
			reviewedAt: new Date(),
			rejectionReason: reason?.trim() || null,
		})
		.where(and(eq(orgRequest.id, id), eq(orgRequest.status, "pending")))
		.returning();

	if (rejected) {
		// best effort: the rejection stands even if the courtesy email fails
		await logQuiet(db, {
			module: "orgs",
			action: "org_request.rejected",
			description: `${actor.name} rejected the request for ${rejected.organizationName}`,
			actorId: actor.id,
			metadata: {
				entityType: "org_request",
				ids: [rejected.id],
				count: 1,
				reason: rejected.rejectionReason,
			},
		});
		try {
			const sent = await orgRequestRejectedEmail(rejected);
			if (sent === false) {
				console.error(
					"rejection email rejected by provider:",
					rejected.id,
				);
			}
		} catch (e) {
			console.error("rejection email failed:", rejected.id, e);
		}
		return rejected;
	}

	// nothing updated: either it doesn't exist or it's no longer pending
	const [existing] = await db
		.select({
			status: orgRequest.status,
			createdOrganizationId: orgRequest.createdOrganizationId,
		})
		.from(orgRequest)
		.where(eq(orgRequest.id, id))
		.limit(1);

	if (!existing) {
		throw new ApiError(404, "Request not found");
	}
	if (existing.status === "pending") {
		throw new ApiError(
			409,
			"Approval was already started; retry approve instead",
		);
	}
	throw new ApiError(409, `Request is already ${existing.status}`);
}

// an `approving` request this old is assumed to belong to a crashed attempt
const APPROVAL_STALE_MS = 5 * 60 * 1000;
// deterministic per request: a retried approval computes the same slug
function slugFor(request: Pick<OrgRequest, "id" | "organizationName">) {
	const base =
		request.organizationName
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 30)
			.replace(/-+$/, "") || "org";
	const suffix = createHash("sha256")
		.update(request.id)
		.digest("hex")
		.slice(0, 10);
	return `${base}-${suffix}`;
}

async function claimForApproval(actorId: string, id: string) {
	const [claimed] = await db
		.update(orgRequest)
		.set({
			status: "approving",
			reviewedBy: actorId,
			reviewedAt: new Date(),
		})
		.where(
			and(
				eq(orgRequest.id, id),
				or(
					eq(orgRequest.status, "pending"),
					and(
						eq(orgRequest.status, "approving"),
						lt(
							orgRequest.reviewedAt,
							new Date(Date.now() - APPROVAL_STALE_MS),
						),
					),
				),
			),
		)
		.returning();
	if (claimed) return claimed;

	const [existing] = await db
		.select({ status: orgRequest.status })
		.from(orgRequest)
		.where(eq(orgRequest.id, id))
		.limit(1);
	if (!existing) throw new ApiError(404, "Request not found");
	if (existing.status === "approving") {
		throw new ApiError(409, "Approval is already in progress");
	}
	throw new ApiError(409, `Request is already ${existing.status}`);
}

async function resolveOwner(request: OrgRequest) {
	let state = await resolveAccountState(request.email);
	if (state.kind === "none") {
		// null means another request won the race; re-reading covers both
		await createPasswordlessUser({
			email: request.email,
			name: request.requesterName,
		});
		state = await resolveAccountState(request.email);
	}
	if (state.kind === "none") {
		throw new ApiError(500, "Could not create the owner account");
	}
	return state;
}

async function ensureOrganization(request: OrgRequest, ownerId: string) {
	if (request.createdOrganizationId) return request.createdOrganizationId;

	const slug = slugFor(request);

	// safety net: an earlier attempt may have created it before recording the id
	const [existing] = await db
		.select({ id: organization.id })
		.from(organization)
		.where(eq(organization.slug, slug))
		.limit(1);
	if (existing) return existing.id;

	// server-side call: no session headers, the owner is passed as userId
	const org = await auth.api.createOrganization({
		body: { name: request.organizationName, slug, userId: ownerId },
	});
	if (!org.id) throw new ApiError(500, "Could not create the organization");
	return org.id;
}

async function ensureOwnerMember(organizationId: string, ownerId: string) {
	const [existing] = await db
		.select({ id: member.id })
		.from(member)
		.where(
			and(
				eq(member.organizationId, organizationId),
				eq(member.userId, ownerId),
			),
		)
		.limit(1);
	if (existing) return;

	await auth.api.addMember({
		body: { userId: ownerId, role: "owner", organizationId },
	});
}

async function sendApprovalEmail(
	state: Exclude<AccountState, { kind: "none" }>,
	organizationName: string,
) {
	const owner = state.user;
	try {
		if (state.kind === "complete") {
			return (
				(await orgApprovedNoticeEmail(owner, organizationName)) !==
				false
			);
		}
		await issueSetPasswordLink(
			owner,
			WELCOME_REDIRECT,
			async (url) =>
				(await welcomeEmail(owner, url, {
					kind: "org-owner",
					organizationName,
				})) !== false,
		);
		return true;
	} catch (e) {
		// adjust to however your ApiError exposes its status
		if (e instanceof ApiError && e.status === 409) {
			return true; // cooldown: a link went out moments ago
		}
		console.error("approval email failed:", owner.id, e);
		return false;
	}
}

async function completeApproval(
	actorId: string,
	request: OrgRequest,
	audit: { actorName: string; source: "approval" | "direct" },
) {
	let state: Exclude<AccountState, { kind: "none" }>;
	let organizationId: string;
	let approved: OrgRequest | undefined;
	try {
		state = await resolveOwner(request);
		organizationId = await ensureOrganization(request, state.user.id);

		// record progress now, so a crash after this point can't create a second org
		await db
			.update(orgRequest)
			.set({
				createdOrganizationId: organizationId,
				ownerUserId: state.user.id,
			})
			.where(eq(orgRequest.id, request.id));

		await ensureOwnerMember(organizationId, state.user.id);

		[approved] = await db
			.update(orgRequest)
			.set({ status: "approved" })
			.where(
				and(
					eq(orgRequest.id, request.id),
					eq(orgRequest.status, "approving"),
				),
			)
			.returning();
		if (!approved) throw new ApiError(409, "Approval state changed");
	} catch (e) {
		// release so the admin can retry immediately; progress stays on the row
		await db
			.update(orgRequest)
			.set({ status: "pending" })
			.where(
				and(
					eq(orgRequest.id, request.id),
					eq(orgRequest.status, "approving"),
					eq(orgRequest.reviewedBy, actorId),
				),
			);
		throw e;
	}
	await logQuiet(db, {
		module: "orgs",
		action:
			audit.source === "direct" ? "org.created" : "org_request.approved",
		description:
			audit.source === "direct"
				? `${audit.actorName} created organization ${request.organizationName} for ${request.requesterName}`
				: `${audit.actorName} approved the request for ${request.organizationName} from ${request.requesterName}`,
		actorId,
		metadata: {
			entityType: "organization",
			ids: [organizationId],
			count: 1,
			requestId: request.id,
			ownerUserId: state.user.id,
		},
	});
	// approved is final; an email failure is recovered with the resend endpoint
	const emailSent = await sendApprovalEmail(state, request.organizationName);
	return { request: approved, emailSent };
}

export async function approveOrgRequestHandler(actor: User, id: string) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}
	const request = await claimForApproval(actor.id, id);
	return completeApproval(actor.id, request, {
		actorName: actor.name,
		source: "approval",
	});
}

export async function createOrganizationForUserHandler(
	actor: User,
	body: { ownerName: string; email: string; organizationName: string },
) {
	if (!actor.isPlatformAdmin) {
		throw new ForbiddenError();
	}

	const ownerName = body.ownerName.trim();
	const organizationName = body.organizationName.trim();
	if (!ownerName || !organizationName) {
		throw new ApiError(
			400,
			"Owner name and organization name are required",
		);
	}

	// inserted already claimed, so it runs through the same pipeline as an approval
	const [request] = await db
		.insert(orgRequest)
		.values({
			id: nanoid(),
			requesterName: ownerName,
			email: normalizeEmail(body.email),
			organizationName,
			status: "approving",
			createdBy: actor.id,
			reviewedBy: actor.id,
			reviewedAt: new Date(),
		})
		.onConflictDoNothing()
		.returning();

	if (!request) {
		throw new ApiError(
			409,
			"This email already has an open organization request; approve it from the queue instead",
		);
	}

	return completeApproval(actor.id, request, {
		actorName: actor.name,
		source: "direct",
	});
}
