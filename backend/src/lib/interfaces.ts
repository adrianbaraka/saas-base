import { t } from "elysia";

// error response interface
export const ErrorResponse = t.Object({
	message: t.String(),
});

export const userResponseSchema = t.Object({
	id: t.String(),
	name: t.String(),
	email: t.String(),
	emailVerified: t.Boolean(),
	image: t.Optional(t.Nullable(t.String())),
	createdAt: t.Date(),
	updatedAt: t.Date(),
	role: t.Optional(t.Nullable(t.String())),
	banned: t.Optional(t.Nullable(t.Boolean())),
	banReason: t.Optional(t.Nullable(t.String())),
	banExpires: t.Optional(t.Nullable(t.Date())),
	welcomeEmailSentAt: t.Optional(t.Nullable(t.Date())),
	tenantId: t.Optional(t.Nullable(t.String())),
});

export const sessionResponseSchema = t.Object({
	id: t.String(),
	expiresAt: t.Date(),
	token: t.String(),
	createdAt: t.Date(),
	updatedAt: t.Date(),
	ipAddress: t.Optional(t.Nullable(t.String())),
	userAgent: t.Optional(t.Nullable(t.String())),
	userId: t.String(),
	impersonatedBy: t.Optional(t.Nullable(t.String())),
});
