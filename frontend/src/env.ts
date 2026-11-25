import { defineEnvVars } from '@sveltejs/kit/env';

const skip = typeof process !== 'undefined' && process.env.SKIP_ENV_VALIDATION === '1';

const required =
	(name: string, opts: { isUrl?: boolean; buildPlaceholder?: string } = {}) =>
	(input: string | undefined) => {
		if (input === undefined || input === '') {
			if (skip) return opts.buildPlaceholder ?? '';
			throw new Error(`Missing required environment variable: ${name}`);
		}
		if (opts.isUrl) {
			try {
				new URL(input);
			} catch {
				throw new Error(`${name} must be a valid URL, got: ${input}`);
			}
		}
		return input;
	};

const BUILD_URL = 'http://localhost:3000';

export const variables = defineEnvVars({
	BACKEND_URL: {
		schema: required('BACKEND_URL', { isUrl: true, buildPlaceholder: BUILD_URL })
	},
	PUBLIC_FRONTEND_URL: {
		public: true,
		schema: required('PUBLIC_FRONTEND_URL', { isUrl: true, buildPlaceholder: BUILD_URL })
	}
});
