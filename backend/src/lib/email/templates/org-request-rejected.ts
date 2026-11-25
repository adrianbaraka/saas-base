import { escapeHtml } from "../utils";

export function orgRequestRejectedTemplate(params: {
	requesterName: string;
	organizationName: string;
}) {
	const name = escapeHtml(params.requesterName);
	const org = escapeHtml(params.organizationName);

	return {
		subject: "Update on your APP_DISPLAY_NAME organization request",
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hello, ${name}</h2>
        <p>Thank you for your interest in APP_DISPLAY_NAME. We're unable to approve your request to set up <strong>${org}</strong> at this time.</p>
        <p>You're welcome to submit a new request in the future.</p>
        <p>If you didn't make this request, you can safely ignore this email.</p>
        <p style="color:#6b7280;font-size:12px;">This is an automated message. Replies aren't monitored.</p>
      </div>
    `,
	};
}
