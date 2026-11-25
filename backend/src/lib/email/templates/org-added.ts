import { escapeHtml, plainText } from "../utils";

export function orgAddedTemplate(params: {
	memberEmail: string;
	organizationName: string;
	adderName: string;
	orgLink: string;
}) {
	// plainText strips newlines and caps length: these come from user input
	const org = plainText(params.organizationName);
	const adder = plainText(params.adderName);

	const orgHtml = escapeHtml(org);
	const adderHtml = escapeHtml(adder);
	const emailHtml = escapeHtml(params.memberEmail);
	const orgLink = escapeHtml(params.orgLink);
	return {
		subject: `${adder} added you to ${org} on APP_DISPLAY_NAME`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>You've been added to an organization</h2>
        <p><strong>${adderHtml}</strong> added you to <strong>${orgHtml}</strong> on APP_DISPLAY_NAME.</p>
        <p>Sign in with <strong>${emailHtml}</strong> and switch to ${orgHtml} to get started:</p>
        <p>
          <a href="${orgLink}" style="background:#4f46e5;color:#fff;padding:10px 20px;
             border-radius:6px;text-decoration:none;">Open ${orgHtml}</a>
        </p>
        <p>Don't remember your password? Use "Forgot password" on the sign-in page.</p>
        <p>If you weren't expecting this, contact ${adderHtml} or your organization's administrator.</p>
        <p style="color:#6b7280;font-size:12px;">This is an automated message. Replies aren't monitored.</p>
      </div>
    `,
	};
}
