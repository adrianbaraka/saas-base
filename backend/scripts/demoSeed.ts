import { faker } from "@faker-js/faker";
import { auth } from "@lib/auth";
import { FullRole } from "@lib/permissions/roles";
import { handleRequestTenancy } from "@routes/v1/tenants/tenants.handlers";

// import { db } from "@lib/db";
// import { seed } from "drizzle-seed";
// import * as authSchema from "@lib/db/schema/auth-schema";
// import * as tenancySchema from "@lib/db/schema/tenancy";

const password = "password123";

function randomUser() {
	const fname = faker.person.firstName();
	const lname = faker.person.lastName();
	return {
		name: fname + " " + lname,
		email: faker.internet.email({
			provider: "test.example",
			firstName: fname,
			lastName: lname,
		}),
	};
}

async function seedUserswithRole(role: FullRole, number = 5) {
	try {
		for (let i = 0; i < number; i++) {
			const rand = randomUser();
			await auth.api.createUser({
				body: {
					email: rand.email,
					name: rand.name,
					password: password,
					role: role,
				},
			});
		}
	} catch (error) {
		console.error(error);
	}
}

async function createTenancyRequests(number = 5) {
	try {
		for (let i = 0; i < number; i++) {
			const rand = randomUser();
			const res = await auth.api.createUser({
				body: {
					email: rand.email,
					name: rand.name,
					password: password,
					role: "requestor",
				},
			});

			const actor = res.user;
			// if (!actor) {
			// 	console.error(
			// 		"Failed to create requestor, skipping tenancy request",
			// 		res,
			// 	);
			// 	continue;
			// }

			const result = await handleRequestTenancy(
				actor,
				faker.company.name(),
			);

			if ("message" in result) {
				console.error(
					"Tenancy request failed for",
					actor.email,
					result,
				);
			}
		}
	} catch (error) {
		console.error(error);
	}
}

async function main() {
	// platform admins
	await seedUserswithRole("platformAdmin", 10	);
	await createTenancyRequests(10);
}

void main();
