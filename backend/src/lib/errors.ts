//import { ElysiaCustomStatusResponse } from "elysia"

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
