const routeRoles = new Map<string, string>();
routeRoles.set('/(protected)/admin', 'admin');

// prefix for routes based on role
const rolePrefixList: Record<string, string> = {
	platformAdmin: '/platform-admin',
	admin: '/admin',
	default: '/user'
};

// search routeRoles for the required role. exact match first, then longest matching prefix
// so nested routes under a protected group inherit the parent's role requirement.
export function getRequiredRole(route: string | null): string | undefined {
	if (!route) return undefined;

	if (routeRoles.has(route)) {
		return routeRoles.get(route);
	}

	let bestMatch: string | undefined;
	for (const key of routeRoles.keys()) {
		if (route.startsWith(key + '/') || route === key) {
			if (!bestMatch || key.length > bestMatch.length) {
				bestMatch = key;
			}
		}
	}

	return bestMatch ? routeRoles.get(bestMatch) : undefined;
}

export function rolePrefix(role: string | null | undefined) {
	if (!role) return rolePrefixList.default;

	return rolePrefixList[role] ?? rolePrefixList.default;
}
