import type { authClient } from './auth-client';
import VisibilityOffIcon from '@iconify-svelte/material-symbols/visibility-off';

export type BetterAuthUser = typeof authClient.$Infer.Session.user;
export type UserSessionFull = typeof authClient.$Infer.Session.session;

export type BetterAuthSession = {
	session: UserSessionFull;
	user: BetterAuthUser;
};

export interface UserSessionResponseFull {
	sessions: UserSessionFull[];
}

export type IconComponent = typeof VisibilityOffIcon;
export type ToastType = 'error' | 'warning' | 'success';

export type ActionLevel = 'warning' | 'danger';
export interface SideLink {
	href?: string;
	name: string;
	icon: IconComponent;
	children?: SideLink[];
}

export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
	joinedAt: string; // ISO 8601 timestamp, e.g. "2026-11-19T06:44:23.203Z"
	roles: OrganizationRole[];
}

export interface OrganizationsResponse {
	organizations: Organization[];
}

export interface AuthError {
	code?: string | undefined | undefined;
	message?: string | undefined | undefined;
	status: number;
	statusText: string;
}

export type TenantRequestStatus = 'pending' | 'approved' | 'rejected' | (string & {});

export interface TenantRequest {
	id: string;
	requesterName: string;
	email: string;
	organizationName: string;
	status: TenantRequestStatus;
	reviewedBy: string | null;
	reviewedAt: string | null; // ISO 8601
	rejectionReason: string | null;
	ownerUserId: string | null;
	createdOrganizationId: string | null;
	createdBy: string | null;
	createdAt: string; // ISO 8601
	updatedAt: string; // ISO 8601
	createdByName: string | null;
	reviewedByName: string | null;
}

export interface OrganizationOwner {
	id: string;
	name: string;
	email: string;
	setupComplete: boolean;
}

export interface PlatformOrganization {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
	createdAt: string; // ISO 8601
	metadata: unknown;
	memberCount: number;
	owners: OrganizationOwner[];
}

export interface PlatformUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	createdAt: string; // ISO 8601
	updatedAt: string; // ISO 8601
	isPlatformAdmin: boolean;
	welcomeEmailSentAt: string | null;
}

export interface OrgMember {
	id: string; // member id, not user id
	name: string;
	email: string;
	phone: string[] | null;
	emailVerified: boolean;
	role: string; // comma-separated, e.g. "admin,billing"
	createdAt: string;
}

export interface OrgMemberDetail {
	id: string; // member id
	userId: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	phone: string[] | null;
	role: string;
	joinedAt: string;
}

export interface OrgRole {
	name: string;
	description: string;
}
