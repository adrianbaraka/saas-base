import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { app } from "../src";
import { mockUser } from "./utils";

const server = `http://${app.server?.hostname}:${app.server?.port}`;

// Snapshot the real modules so any `mock.module` override can be undone
const realAuthModule = await import("@lib/auth");
const realQueriesModule = await import("@lib/db/queries");

describe("GET /users", () => {
	beforeEach(async () => {
		await mockUser({ isAuthenticated: false });
	});

	afterEach(async () => {
		await mock.module("@lib/auth", () => realAuthModule);
		mock.restore();
	});

	it("should return 401 Unauthorized if no session is provided", async () => {
		await mockUser({ isAuthenticated: false });
		const response = await app.handle(new Request(`${server}/v1/users`));

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body).toHaveProperty("error");
	});

	it("should return 403 Forbidden if user lacks admin role", async () => {
		await mockUser();

		const response = await app.handle(
			new Request(`${server}/v1/users`, {
				headers: { Authorization: "Bearer mock-token" },
			}),
		);

		expect(response.status).toBe(403);
	});

	it("should return 200 and a list of users when admin", async () => {
		await mockUser({ roles: ["admin"] });

		const response = await app.handle(
			new Request(`${server}/v1/users`, {
				headers: { Authorization: "Bearer mock-token" },
			}),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(Array.isArray(body)).toBe(true);
	});
});

describe("GET /users/:id", () => {
	beforeEach(() => {
		mockUser({ isAuthenticated: false });
	});

	afterEach(() => {
		mock.module("@lib/auth", () => realAuthModule);
		mock.module("@lib/db/queries", () => realQueriesModule);
		mock.restore();
	});

	it("should return 401 Unauthorized if no session is provided", async () => {
		// Already unauthenticated via beforeEach; kept explicit for readability.
		mockUser({ isAuthenticated: false });

		const response = await app.handle(
			new Request(`${server}/v1/users/user-abc`),
		);

		expect(response.status).toBe(401);
	});

	it("should return 404 Not Found if user attempts to fetch another user's profile", async () => {
		mockUser(); // authenticated as user "123"

		const response = await app.handle(
			new Request(`${server}/v1/users/456`, {
				headers: { Authorization: "Bearer mock-token" },
			}),
		);

		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toBe("User '456' not found.");
	});

	it("should return 200 and user data if user fetches their own profile", async () => {
		mockUser();

		mock.module("@lib/db/queries", () => ({
			...realQueriesModule,
			queryUser: async (id: string) => ({
				id: String(id),
				name: "test",
				email: "test@email.com",
				emailVerified: false,
				image: "",
				createdAt: new Date("2026-06-22T09:53:44.472Z"),
				updatedAt: new Date("2026-06-22T09:53:44.472Z"),
				roles: ["user"],
			}),
		}));

		const response = await app.handle(
			new Request(`${server}/v1/users/123`, {
				headers: { Authorization: "Bearer mock-token" },
			}),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toHaveProperty("id", "123");
	});

	it("should return 200 if an admin attempts to fetch another user's data", async () => {
		mockUser({ id: "123", roles: ["admin"] });

		mock.module("@lib/db/queries", () => ({
			...realQueriesModule,
			queryUser: async (id: string) => ({
				id: String(id),
				name: "Target User",
				email: "target@email.com",
				emailVerified: true,
				image: "",
				createdAt: new Date(),
				updatedAt: new Date(),
				roles: ["user"],
			}),
		}));

		const response = await app.handle(
			new Request(`${server}/v1/users/456`, {
				headers: { Authorization: "Bearer mock-token" },
			}),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toHaveProperty("id", "456");
	});
});

describe("PATCH /users/addrole", () => {
	beforeEach(() => {
		mockUser({ isAuthenticated: false });
	});

	afterEach(() => {
		mock.module("@lib/auth", () => realAuthModule);
		mock.module("@lib/db/queries", () => realQueriesModule);
		mock.restore();
	});

	it("Should return 401  for non authenticated user.", async () => {
		mockUser({ isAuthenticated: false });
		const response = await app.handle(
			new Request(`${server}/v1/users/addRole`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: "123",
					role: "admin",
				}),
			}),
		);
		expect(response.status).toBe(401);
	});

	it("Should return 403 for non admin user.", async () => {
		mockUser();
		const response = await app.handle(
			new Request(`${server}/v1/users/addRole`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: "123",
					role: "admin",
				}),
			}),
		);
		expect(response.status).toBe(403);
	});

	it("Should return 404 for non existent role.", async () => {
		mockUser({ roles: ["admin"] });
		const response = await app.handle(
			new Request(`${server}/v1/users/addRole`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: "123",
					role: "",
				}),
			}),
		);
		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body).toHaveProperty("error", "Role '' not found.");
	});
});

describe("GET /users/roles", () => {
	beforeEach(() => {
		mockUser({ isAuthenticated: false });
	});

	afterEach(() => {
		mock.module("@lib/auth", () => realAuthModule);
		mock.module("@lib/db/queries", () => realQueriesModule);
		mock.restore();
	});

	it("Should return 403 for non admin user", async () => {
		mockUser();
		const response = await app.handle(
			new Request(`${server}/v1/users/addRole`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: "123",
					role: "admin",
				}),
			}),
		);
		expect(response.status).toBe(403);
	});

	it("Should return 401  for non authenticated user.", async () => {
		mockUser({ isAuthenticated: false });
		const response = await app.handle(
			new Request(`${server}/v1/users/addRole`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: "123",
					role: "admin",
				}),
			}),
		);
		expect(response.status).toBe(401);
	});
});
