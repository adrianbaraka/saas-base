import { User } from "@lib/auth"
import { db } from "@lib/db"
import { member, organization } from "@lib/db/schema/auth-schema"
import { asc, eq } from "drizzle-orm";

export async function listMyOrganizationsHandler(actor: User) {
	const rows = await db
		.select({
			id: organization.id,
			name: organization.name,
			slug: organization.slug,
			logo: organization.logo,
			role: member.role,
			joinedAt: member.createdAt,
		})
		.from(member)
		.innerJoin(organization, eq(organization.id, member.organizationId))
		.where(eq(member.userId, actor.id))
		.orderBy(asc(organization.name));

	return {
		organizations: rows.map(({ role, ...org }) => ({
			...org,
			// roles are stored comma-separated; return them as a list
			roles: role
				.split(",")
				.map((r) => r.trim())
				.filter(Boolean),
		})),
	};
}