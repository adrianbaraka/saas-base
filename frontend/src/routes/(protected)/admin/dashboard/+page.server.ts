// +page.server.ts or +layout.server.ts
export const load = async ({ locals }) => {
	const session = locals.session;
	return { me: session?.user };
};
