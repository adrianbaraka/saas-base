import { t } from "elysia";

// error response interface
export const ErrorResponse = t.Object({
	error: t.String(),
});

