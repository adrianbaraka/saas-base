import type { OrganizationRole } from './interfaces';

// Resolve role prefix
export function getRolePrefix(role: OrganizationRole): string {
	const mapping: Record<OrganizationRole, string> = {
		owner: 'admin',
		admin: 'admin',
		member: 'member'
	};

	return mapping[role];
}

// Resolve organization dashboard destination
export function getOrganizationDestination(orgId: string, role: OrganizationRole): string {
	return `/${orgId}/${getRolePrefix(role)}/dashboard`;
}

export type UserAccess = {
	isPlatformAdmin: boolean;
	organizations: Record<string, OrganizationRole>;
};

const requiredRoles: Record<string, OrganizationRole[]> = {
	admin: ['owner', 'admin'],
	member: ['member']
};

const authedRoutes = ['/continue'];

export function canAccessRoute(pathname: string, user: UserAccess): boolean {
	const [orgId, prefix] = pathname.split('/').filter(Boolean);

	// Routes accessible to everyone (exact matching)
	if (authedRoutes.includes(pathname)) return true;

	if (orgId === 'platform-admin') return user.isPlatformAdmin;
	if (!orgId || !prefix) return false;
	if (!Object.hasOwn(user.organizations, orgId)) return false;
	if (!Object.hasOwn(requiredRoles, prefix)) return false;

	return requiredRoles[prefix].includes(user.organizations[orgId]);
}
