import type { DbOrTx } from "./db";
import { activities, activityLevel, type ActivityMetadata } from "./db/schema/activities"

export type Level = (typeof activityLevel.enumValues)[number];

/**
 * Source of truth: module -> action -> default level.
 * Action keys are append-only: add new ones, don't rename (old rows keep old keys).
 */
export const ACTIONS = {
	members: {
		"member.added": "normal",
		"member.role_changed": "high",
		"member.left": "normal",
		"member.removed": "normal",
	},
	platform: {
		"platform_admin.created": "high",
	},
	orgs: {
		"org.created": "normal",
		"org_request.approved": "normal",
		"org_request.rejected": "normal",
	},
} as const satisfies Record<string, Record<string, Level>>;

export type Module = keyof typeof ACTIONS;
export const MODULES = Object.keys(ACTIONS) as Module[];

/** Which feed each module appears in. A module belongs to exactly one scope. */
export const SCOPES = {
	platform: ["platform", "orgs"],
	organization: ["members"],
} as const satisfies Record<string, readonly Module[]>;

export type Scope = keyof typeof SCOPES;

// A compile error here means a module in ACTIONS isn't assigned to any scope.
export const _everyModuleHasAScope: [
	Exclude<Module, (typeof SCOPES)[Scope][number]>,
] extends [never]
	? true
	: never = true;

type ActionOf<M extends Module> = keyof (typeof ACTIONS)[M] & string;

// Distributes over modules so `action` must belong to the chosen `module`.
export type AuditInput = {
	[M in Module]: {
		module: M;
		action: ActionOf<M>;
		description: string; // 'Graduated 300 students'
		organizationId?: string | null;
		actorId?: string | null; // omit for system actions
		level?: Level; // overrides the action's default level
		metadata?: ActivityMetadata;
	};
}[Module];

/**
 * Writes an audit entry. Pass `tx` to make it part of the action's
 * transaction (a failed log then fails the action).
 */
export async function log(executor: DbOrTx, input: AuditInput) {
	const defaultLevel = (ACTIONS[input.module] as Record<string, Level>)[
		input.action
	];

	await executor.insert(activities).values({
		module: input.module,
		action: input.action,
		description: input.description,
		organizationId: input.organizationId ?? null,
		actorId: input.actorId ?? null,
		level: input.level ?? defaultLevel ?? "normal",
		metadata: input.metadata,
	});
}

/**
 * Same as `log` but never throws, so a logging failure can't break the thing
 * being logged (logins etc.). Pass `db`, not `tx`: a failed statement inside
 * a Postgres transaction aborts the whole transaction even if you catch it.
 */
export async function logQuiet(executor: DbOrTx, input: AuditInput) {
	try {
		await log(executor, input);
	} catch (err) {
		console.error("audit log failed", err);
	}
}
