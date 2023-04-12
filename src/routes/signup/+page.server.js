import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";

export const actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const username = form.get("username");
		const password = form.get("password");

		// check for empty values
		if (typeof username !== "string" || typeof password !== "string") {
			return fail(400);
		}

		try {
			const user = await auth.createUser({
				primaryKey: {
					providerId: "username",
					providerUserId: username,
					password
				},
				attributes: {
					username
				}
			});
			console.log(user);
			const session = await auth.createSession(user.userId);
			locals.auth.setSession(session);
		} catch (e) {
			throw e; // rethrow
			return fail(400);
		}
	}
};
