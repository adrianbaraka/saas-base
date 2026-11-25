import { escapeHtml, sendEmail } from "../utils";

export function orgApprovedNoticeTemplate(params: {
	requesterName: string;
	organizationName: string;
}) {
	const name = escapeHtml(params.requesterName);
	const org = escapeHtml(params.organizationName);

	return {
		subject: "Your APP_DISPLAY_NAME organization has been approved",
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hello, ${name}</h2>
        <p>Your organization <strong>${org}</strong> has been approved on APP_DISPLAY_NAME, and you are its owner.</p>
        <p>Sign in with your existing account to get started.</p>
        <p style="color:#6b7280;font-size:12px;">This is an automated message. Replies aren't monitored.</p>
      </div>
    `,
	};
}

export async function orgApprovedNoticeEmail(
	user: { name: string; email: string },
	organizationName: string,
) {
	const { subject, html } = orgApprovedNoticeTemplate({
		requesterName: user.name,
		organizationName,
	});
	return sendEmail({ to: user.email, subject, html });
}
