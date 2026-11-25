//import { ElysiaCustomStatusResponse } from "elysia"

import {
	InvalidCookie,
	NotFound,
	ParseError,
	t,
	ValidationError,
} from "elysia";

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly details?: unknown,
	) {
		super(message);

		this.name = new.target.name;

		// Maintains proper stack trace (Node.js / Bun)
		//Error.captureStackTrace.apply(this, new.target)
		//Error.captureStackTrace.(this, new.target);
	}
}

export class UnauthorizedError extends ApiError {
	constructor(message = "Unauthorized", details?: unknown) {
		super(401, message, details);
	}
}

export class ForbiddenError extends ApiError {
	constructor(message = "Forbidden", details?: unknown) {
		super(403, message, details);
	}
}

export class NotFoundError extends ApiError {
	constructor(message = "Not Found", details?: unknown) {
		super(404, message, details);
	}
}

export class UnexpectedError extends ApiError {
	constructor(message = "An unexpected error occurred.", details?: unknown) {
		super(500, message, details);
	}
}

export class ConflictError extends ApiError {
	constructor(message = "Conflict", details?: unknown) {
		super(409, message, details);
	}
}

export const ErrorResponse = t.Object({
	message: t.String(),
});
type ErrorReply = { status: number; body: { message: string } };
export function toErrorReply(error: unknown): ErrorReply {
	// 4xx pass through with their own message
	if (error instanceof ApiError && error.status < 500) {
		return { status: error.status, body: { message: error.message } };
	}

	// Elysia's own errors
	if (error instanceof ValidationError) {
		console.error(error);

		return { status: 400, body: { message: "Invalid request" } };
	}
	if (error instanceof ParseError || error instanceof InvalidCookie) {
		return { status: 400, body: { message: "Invalid request" } };
	}
	if (error instanceof NotFound) {
		return { status: 404, body: { message: "Not found" } };
	}

	// Anything else, including ApiError with status >= 500 (UnexpectedError)
	console.error(error);
	return { status: 500, body: { message: "An unexpected error occurred." } };
}
