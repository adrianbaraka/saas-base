import { mock } from "bun:test";

export function mockUser({
	id = "123",
	roles = ["user"],
	token = "mock-token",
	isAuthenticated = true,
}: {
	id?: string;
	roles?: string[];
	token?: string;
	isAuthenticated?: boolean;
} = {}) {
	if (!isAuthenticated) {
		return mock.module("@lib/auth", () => ({
			auth: { api: { getSession: async () => null } },
		}));
	}

	return mock.module("@lib/auth", () => ({
		auth: {
			api: {
				getSession: async () => ({
					user: {
						id,
						roles,
						name: "Test User",
						email: "test@example.com",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					session: {
						token,
						createdAt: new Date(),
						updatedAt: new Date(),
						expiresAt: new Date(Date.now() + 1000 * 60 * 60),
						userId: id,
					},
				}),
			},
		},
	}));
}