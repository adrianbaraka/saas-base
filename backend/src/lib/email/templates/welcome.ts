import { escapeHtml, plainText } from "../utils";

export type WelcomeContext =
	| { kind: "platform-admin" }
	| { kind: "org-member"; organizationName: string; inviterName?: string }
	| { kind: "org-owner"; organizationName: string };

function subjectFor(context: WelcomeContext) {
	switch (context.kind) {
		case "platform-admin":
			return "Welcome to APP_DISPLAY_NAME: set your password";
		case "org-member":
			return `You've been added to ${plainText(context.organizationName)} on APP_DISPLAY_NAME`;
		case "org-owner":
			return `${plainText(context.organizationName)} has been approved on APP_DISPLAY_NAME`;
	}
}

function introFor(context: WelcomeContext) {
	switch (context.kind) {
		case "platform-admin":
			return "An account has been created for you on APP_DISPLAY_NAME as a platform administrator.";
		case "org-member": {
			const org = `<strong>${escapeHtml(plainText(context.organizationName))}</strong>`;
			const added = context.inviterName
				? `${escapeHtml(plainText(context.inviterName))} added you to ${org} on APP_DISPLAY_NAME.`
				: `You have been added to ${org} on APP_DISPLAY_NAME.`;
			return `${added} An account has been created for you.`;
		}
		case "org-owner": {
			const org = `<strong>${escapeHtml(plainText(context.organizationName))}</strong>`;
			return `Your organization ${org} has been approved on APP_DISPLAY_NAME, and you have been set up as its owner.`;
		}
	}
}

export function welcomeTemplate(params: {
	name: string;
	setPasswordUrl: string;
	expiresInDays: number;
	context: WelcomeContext;
}) {
	const name = escapeHtml(params.name);
	const setPasswordUrl = escapeHtml(params.setPasswordUrl);

	return {
		subject: subjectFor(params.context),
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome, ${name}!</h2>
        <p>${introFor(params.context)} Set your password to get started:</p>
        <p>
          <a href="${setPasswordUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;
             border-radius:6px;text-decoration:none;">Set Password</a>
        </p>
        <p>This link expires in ${params.expiresInDays} days. If you weren't expecting this, you can safely ignore this email.</p>
        <p style="color:#6b7280;font-size:12px;">This is an automated message. Replies aren't monitored.</p>
      </div>
    `,
	};
}
