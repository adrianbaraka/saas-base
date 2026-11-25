import { escapeHtml } from "../utils";

export function verificationTemplate(params: {
	name: string;
	verifyUrl: string;
}) {
	const name = escapeHtml(params.name);
	// Escape the URL too: its query string contains "&", which must be "&amp;" inside an HTML attribute
	const verifyUrl = escapeHtml(params.verifyUrl);

	return {
		subject: "Verify your email address",
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>Thanks for signing up for APP_DISPLAY_NAME. Confirm your email address to get started:</p>
        <p>
          <a href="${verifyUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;
             border-radius:6px;text-decoration:none;">Verify Email</a>
        </p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
	};
}
