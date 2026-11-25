import { env } from "@lib/env";
import { Resend } from "resend";

export function escapeHtml(s: string) {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

//const resend = new Resend(env.RESEND_API_KEY);
const resend = new Resend(env.RESEND_API_KEY);
const FROM = env.EMAIL_FROM;

export async function sendEmail(params: {
	to: string;
	subject: string;
	html: string;
}) {
	if (process.env.NODE_ENV !== "production" || env.SEND_EMAIL !== "true") {
		console.log(
			`to: ${params.to} subject: ${params.subject} html: ${params.html}`,
		);
		return;
	}
	const { error } = await resend.emails.send({ from: FROM, ...params });

	if (error) {
		// Log but don't throw: a failed email shouldn't crash the auth request
		console.error(
			`[email] failed to send "${params.subject}" to ${params.to}`,
			error,
		);
		return false;
	}
	return true;
}

// collapse whitespace/newlines and cap length: used for names that end up
// in the subject line or body but come from user input
export function plainText(value: string, max = 80) {
	return value.replace(/\s+/g, " ").trim().slice(0, max);
}
