export function resetPasswordTemplate(params: {
	name: string;
	resetUrl: string;
}) {
	const { name, resetUrl } = params;

	return {
		subject: "Reset your password",
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>We received a request to reset your password. Click below to continue:</p>
        <p>
          <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;
             border-radius:6px;text-decoration:none;">Reset Password</a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
	};
}
