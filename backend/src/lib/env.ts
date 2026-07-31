const requiredEnv = [
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_URL",
	"DATABASE_URL",
	"DEFAULT_ADMIN_EMAIL",
	"DEFAULT_ADMIN_NAME",
	"CACHE_MINUTES"
] as const;

type RequiredEnv = Record<(typeof requiredEnv)[number], string>;

function loadEnv(): RequiredEnv {
	const missing = requiredEnv.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		console.error(
			`Missing required environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
		);
		process.exit(1);
	}

	return Object.fromEntries(
		requiredEnv.map((key) => [key, process.env[key] as string]),
	) as RequiredEnv;
}

export const env = loadEnv();