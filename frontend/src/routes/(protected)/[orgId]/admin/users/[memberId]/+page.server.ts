import type { OrgMemberDetail, OrgRole } from '#lib/interfaces.ts';
import { getJson, getJsonOr } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const orgPath = `/api/v1/organizations/${encodeURIComponent(params.orgId)}`;

	// not awaited: the page renders now and the roles stream in.
	// getJsonOr never rejects, so there's no unhandled rejection.
	const roles = getJsonOr<OrgRole[]>(locals, `${orgPath}/roles?assignable=true`, []);

	const data = await getJson<{ member: OrgMemberDetail }>(
		locals,
		`${orgPath}/members/${encodeURIComponent(params.memberId)}`,
		'Failed to load member'
	);

	return {
		member: data.member,
		roles,
		me: locals.session?.user
	};
};
