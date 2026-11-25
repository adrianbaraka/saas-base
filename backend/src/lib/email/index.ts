import { User } from "better-auth";
import { resetPasswordTemplate } from "./templates/reset-password";
import { verificationTemplate } from "./templates/verification";
import { WelcomeContext, welcomeTemplate } from "./templates/welcome";
import { existingSignUpTemplate } from "./templates/existing";
import { sendEmail } from "./utils";
import { OrgRequest } from "@lib/db/schema/orgs";
import { orgRequestRejectedTemplate } from "./templates/org-request-rejected";
import { orgAddedTemplate } from "./templates/org-added";
import { env } from "@lib/env";
import { INVITE_TTL_MS } from "@lib/utils";

export async function resetPasswordEmail(user: User, url: string) {
	const { subject, html } = resetPasswordTemplate({
		name: user.name,
		resetUrl: url,
	});
	return sendEmail({ to: user.email, subject, html });
}

export async function verificationEmail(user: User, url: string) {
	const { subject, html } = verificationTemplate({
		name: user.name,
		verifyUrl: url,
	});
	return sendEmail({ to: user.email, subject, html });
}

export async function welcomeEmail(
	user: { name: string; email: string },
	url: string,
	context: WelcomeContext,
) {
	const { subject, html } = welcomeTemplate({
		name: user.name,
		setPasswordUrl: url,
		expiresInDays: Math.round(INVITE_TTL_MS / 86_400_000),
		context,
	});
	return sendEmail({ to: user.email, subject, html });
}

export async function existingSignUpEmail(user: User) {
	const { subject, html } = existingSignUpTemplate({
		name: user.name,
		signInUrl: `${process.env.APP_URL}/sign-in`,
	});
	return sendEmail({ to: user.email, subject, html });
}

// the narrow type means the internal rejection reason can't be passed in by accident
export async function orgRequestRejectedEmail(
	request: Pick<OrgRequest, "email" | "requesterName" | "organizationName">,
) {
	const { subject, html } = orgRequestRejectedTemplate({
		requesterName: request.requesterName,
		organizationName: request.organizationName,
	});
	return sendEmail({ to: request.email, subject, html });
}

export async function orgAddedEmail(params: {
	email: string;
	organizationId: string;
	organizationName: string;
	adderName: string;
}) {
	const { subject, html } = orgAddedTemplate({
		memberEmail: params.email,
		organizationName: params.organizationName,
		adderName: params.adderName,
		orgLink: `${env.BETTER_AUTH_URL}/login`,
	});
	return sendEmail({ to: params.email, subject, html });
}

export async function sendOrgMemberAdded(
	user: { email: string },
	organizationId: string,
	organizationName: string,
	adderName: string,
) {
	await orgAddedEmail({
		email: user.email,
		organizationId,
		organizationName,
		adderName,
	});
}
