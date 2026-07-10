import { User } from "better-auth";
//import { Resend } from "resend";

//const resend = new Resend(process.env.RESEND_API_KEY);

// async function Email() {
//   const { data, error } = await resend.emails.send({
//     from: 'Acme <onboarding@resend.dev>',
//     to: ['delivered@resend.dev'],
//     subject: 'Hello World',
//     html: '<strong>It works!</strong>',
//   });

//   if (error) {
//     return console.error({ error });
//   }

//   console.log({ data });
// };

export function resetPasswordEmail(user: User, url: string) {
	// TODO use resend to send email
	console.log(`Password reset email for ${user.email}. url: ${url}`);
}

export function verificationEmail(user: User, url: string) {
	// TODO use resend to send email
	console.log(`Verification email for ${user.email}. url: ${url}`);
}

export function welcomeEmail(user: User, url: string) {
	// TODO use resend to send email
	console.log(`Welcome email for ${user.email}. url: ${url}`);
}

export function existingSignUpEmail(user: User) {
	// TODO use resend to send email
	console.log(
		`${user.email} Someone tried to create an account using your email address. If this was you, try signing in instead. If not, you can safely ignore this email.`,
	);
}
