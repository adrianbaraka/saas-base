import { escapeHtml } from "../utils";

export function existingSignUpTemplate(params: {
	name: string;
	signInUrl: string;
}) {
	const name = escapeHtml(params.name);
	const signInUrl = escapeHtml(params.signInUrl);

	return {
		subject: "Sign-up attempt on your APP_DISPLAY_NAME account",
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>Someone tried to create a APP_DISPLAY_NAME account using your email address, but you already have one.</p>
        <p>If this was you, sign in instead. If you've forgotten your password, use the "Forgot password?" link on the sign-in page.</p>
        <p>
          <a href="${signInUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;
             border-radius:6px;text-decoration:none;">Sign In</a>
        </p>
        <p>If this wasn't you, you can safely ignore this email. Your account has not been changed.</p>
        <p style="color:#6b7280;font-size:12px;">This is an automated message. Replies aren't monitored.</p>
      </div>
    `,
	};
}
