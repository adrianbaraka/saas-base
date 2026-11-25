import { trustedOrigins, User } from "@lib/auth";
import { db } from "@lib/db";
import {
	member,
	user as authSchemaUser,
	verification,
} from "@lib/db/schema/auth-schema";
import { welcomeEmail } from "@lib/email";
import { env } from "@lib/env";
import { ApiError } from "@lib/errors";
import { INVITE_TTL_MS } from "@lib/utils";
import { and, eq, isNull, like, lt, or } from "drizzle-orm";
import { nanoid } from "nanoid";

export type AccountRow = User;

export type AccountState =
	| { kind: "none" }
	| { kind: "pending"; user: AccountRow; isMember: boolean }
	| { kind: "complete"; user: AccountRow; isMember: boolean };

export function normalizeEmail(rawEmail: string) {
	return rawEmail.trim().toLowerCase();
}

/**
 * Snapshot of what exists for an email. No authorization happens here;
 * callers authorize first. `isMember` is only computed when an
 * organizationId is passed, otherwise it is false.
 */
export async function resolveAccountState(
	rawEmail: string,
	organizationId?: string,
): Promise<AccountState> {
	const email = normalizeEmail(rawEmail);

	const [existing] = await db
		.select()
		.from(authSchemaUser)
		.where(eq(authSchemaUser.email, email))
		.limit(1);

	if (!existing) return { kind: "none" };

	let isMember = false;
	if (organizationId) {
		const [row] = await db
			.select({ id: member.id })
			.from(member)
			.where(
				and(
					eq(member.userId, existing.id),
					eq(member.organizationId, organizationId),
				),
			)
			.limit(1);
		isMember = row !== undefined;
	}

	return {
		kind: existing.emailVerified ? "complete" : "pending",
		user: existing,
		isMember,
	};
}

/**
 * Inserts a user with no credential account, so they cannot sign in until
 * they set a password via the set-password link. Returns null if the email
 * was taken in the meantime; the caller should re-run resolveAccountState.
 *
 * `isPlatformAdmin` must only ever be set by server code on the platform
 * route, never from a request body.
 */
export async function createPasswordlessUser(input: {
	email: string;
	name: string;
	phone?: string[];
	isPlatformAdmin?: boolean;
}): Promise<AccountRow | null> {
	const [created] = await db
		.insert(authSchemaUser)
		.values({
			id: nanoid(32),
			email: normalizeEmail(input.email),
			name: input.name.trim(),
			phone: input.phone?.length ? input.phone : null,
			emailVerified: false,
			isPlatformAdmin: input.isPlatformAdmin ?? false,
		})
		.onConflictDoNothing({ target: authSchemaUser.email })
		.returning();

	return created ?? null;
}

const RESEND_COOLDOWN_MS = 60_000;

export function assertTrustedRedirect(redirectTo: string) {
	let origin: string;
	try {
		origin = new URL(redirectTo).origin;
	} catch {
		throw new ApiError(400, "Invalid redirectTo");
	}
	if (!trustedOrigins.includes(origin)) {
		throw new ApiError(400, "redirectTo origin not allowed");
	}
}

/**
 * Issues a 7-day set-password link for a pending user and sends it.
 *
 * Callers must authorize AND check visibility first. The 400/409 errors
 * below are only safe to surface to callers who may already see this user.
 * `send` receives the link and returns false (or throws) on failure, so
 * each caller picks the email template and wording.
 */
export async function issueSetPasswordLink(
	invitee: AccountRow,
	redirectTo: string,
	send: (url: string) => Promise<boolean>,
): Promise<void> {
	assertTrustedRedirect(redirectTo);

	if (invitee.emailVerified) {
		throw new ApiError(400, "User has already completed setup");
	}

	const previousSentAt = invitee.welcomeEmailSentAt;
	const token = nanoid(32);
	const identifier = `reset-password:${token}`;
	const now = new Date();

	await db.transaction(async (tx) => {
		// Atomically claim the cooldown slot while the user is still pending.
		const claimed = await tx
			.update(authSchemaUser)
			.set({ welcomeEmailSentAt: now })
			.where(
				and(
					eq(authSchemaUser.id, invitee.id),
					eq(authSchemaUser.emailVerified, false),
					or(
						isNull(authSchemaUser.welcomeEmailSentAt),
						lt(
							authSchemaUser.welcomeEmailSentAt,
							new Date(Date.now() - RESEND_COOLDOWN_MS),
						),
					),
				),
			)
			.returning({ id: authSchemaUser.id });

		if (claimed.length === 0) {
			// Either the cooldown is active or setup finished in the meantime.
			const [current] = await tx
				.select({ emailVerified: authSchemaUser.emailVerified })
				.from(authSchemaUser)
				.where(eq(authSchemaUser.id, invitee.id))
				.limit(1);
			if (current?.emailVerified) {
				throw new ApiError(400, "User has already completed setup");
			}
			throw new ApiError(409, "Invite recently sent, try again shortly");
		}

		// Invalidate earlier links for this user.
		await tx
			.delete(verification)
			.where(
				and(
					like(verification.identifier, "reset-password:%"),
					eq(verification.value, invitee.id),
				),
			);

		await tx.insert(verification).values({
			id: nanoid(),
			identifier,
			value: invitee.id,
			expiresAt: new Date(Date.now() + INVITE_TTL_MS),
			createdAt: now,
			updatedAt: now,
		});
	});

	const url = `${env.BETTER_AUTH_URL}/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent(redirectTo)}`;

	let sent = false;
	try {
		sent = await send(url);
	} catch (e) {
		console.error("set-password email failed:", e);
	}

	if (!sent) {
		// Undo: drop the undelivered link and release our cooldown claim.
		await db
			.delete(verification)
			.where(eq(verification.identifier, identifier));
		await db
			.update(authSchemaUser)
			.set({ welcomeEmailSentAt: previousSentAt })
			.where(
				and(
					eq(authSchemaUser.id, invitee.id),
					eq(authSchemaUser.welcomeEmailSentAt, now),
				),
			);
		throw new ApiError(502, "Failed to send the welcome email");
	}
}

function fail(message: string, error?: unknown): never {
	console.error(message);
	if (error) console.error(error);
	process.exit(1);
}

// create the first platform admin from env vars if none has finished setup
export async function defaultAdmin() {
	// bootstrap is done once a platform admin has set a password
	const completed = await db.$count(
		authSchemaUser,
		and(
			eq(authSchemaUser.isPlatformAdmin, true),
			eq(authSchemaUser.emailVerified, true),
		),
	);
	if (completed > 0) {
		console.log("A platform admin account already exists.");
		return;
	}

	let state = await resolveAccountState(env.DEFAULT_ADMIN_EMAIL);

	if (state.kind === "none") {
		// null means another instance inserted it first; we re-read either way
		await createPasswordlessUser({
			email: env.DEFAULT_ADMIN_EMAIL,
			name: env.DEFAULT_ADMIN_NAME,
			isPlatformAdmin: true,
		});
		state = await resolveAccountState(env.DEFAULT_ADMIN_EMAIL);
	}

	if (state.kind === "none") {
		fail("An error occurred creating the default platform admin user.");
	}
	if (!state.user.isPlatformAdmin) {
		fail(
			"DEFAULT_ADMIN_EMAIL belongs to an existing non-admin user; refusing to promote it.",
		);
	}
	if (state.kind === "complete") {
		console.log("A platform admin account already exists.");
		return;
	}

	// pending: send the invite unless a still-valid one is already out
	const admin = state.user;
	const sentAt = admin.welcomeEmailSentAt;
	if (sentAt && Date.now() - sentAt.getTime() < INVITE_TTL_MS) {
		console.log(
			"Default platform admin invite already sent and still valid.",
		);
		return;
	}

	try {
		await issueSetPasswordLink(
			admin,
			`${env.BETTER_AUTH_URL}/welcome`,
			async (url) =>
				(await welcomeEmail(admin, url, { kind: "platform-admin" })) !==
				false,
		);
		console.log("Default platform admin invite sent.");
	} catch (error) {
		// adjust to however your ApiError exposes its status
		if (error instanceof ApiError && error.status === 409) {
			console.log("Default platform admin invite was just sent.");
			return;
		}
		fail("Failed to send the default platform admin invite.", error);
	}
}

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
