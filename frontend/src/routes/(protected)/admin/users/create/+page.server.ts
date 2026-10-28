import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { BetterAuthUser, Role } from '#lib';

type userRes = {
	user: BetterAuthUser;
};

export const load: PageServerLoad = async ({ locals }) => {
	let res: Response;
	try {
		res = await locals.backendFetch('/api/v1/users/roles');
	} catch (e) {
		console.error(e);
		error(503, 'An Unexpected error occurred.');
	}

	switch (res.status) {
		case 401:
			error(401, 'Unauthenticated');
			break;
		case 403:
			error(403, 'Unauthorized');
	}

	if (!res.ok) {
		console.error(res.status);
		error(res.status, 'Failed to load roles');
	}

	let rolesRes: Role[];
	try {
		rolesRes = await res.json();
	} catch (e) {
		console.error(e);
		error(503, 'An Unexpected error occurred.');
	}

	return { me: locals.session?.user, roles: rolesRes };
};

// after creating the new user if send welcome email is checked
// send an email with a link to set their password and verify their email.
// uses the endpoint request password reset
export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		const data = await request.formData();

		const fullPayLoad = {
			firstName: data.get('firstName')?.toString().trim(),
			middleName: data.get('middleName')?.toString().trim(),
			lastName: data.get('lastName')?.toString().trim(),
			email: data.get('email')?.toString().trim(),
			role: data.get('role')?.toString(),
			sendEmail: data.get('sendEmail')
		};
		if (
			!fullPayLoad.firstName ||
			!fullPayLoad.lastName ||
			!fullPayLoad.email ||
			!fullPayLoad.role
		) {
			return fail(400, {
				...fullPayLoad,
				error: 'Please fill in all required fields'
			});
		}
		const payLoad = {
			name: [fullPayLoad.firstName, fullPayLoad.middleName, fullPayLoad.lastName]
				.filter((part): part is string => Boolean(part && part.trim()))
				.join(' '),
			email: fullPayLoad.email,
			role: fullPayLoad.role
		};
		if (!locals.session?.user.role?.includes('admin')) {
			return error(403, 'Unauthorised');
		}
		try {
			const res = await locals.backendFetch('/api/auth/admin/create-user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payLoad)
			});

			if (!res.ok) {
				let message = 'Failed to create user';
				try {
					const errBody = await res.json();
					message = errBody?.error ?? message;
				} catch {
					// response wasn't JSON, fall back to status text
					message = res.statusText || message;
				}

				return fail(res.status, {
					...fullPayLoad,
					error: message
				});
			}
			//
			const created: userRes = await res.json();

			redirect(303, `/admin/users/${created.user.id}`);
		} catch (error) {
			if (isRedirect(error)) throw error;

			console.error('createUser action failed:', error);
			return fail(500, {
				...payLoad,
				error: 'Something went wrong. Please try again.'
			});
		}
	}
};
