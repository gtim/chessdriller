import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";
import { PrismaClient } from '@prisma/client';
const prismaClient = new PrismaClient();

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
			// create a new Chessdriller user, authenticated by the Auth user
			const newCdUser = await prismaClient.user.create({ data: {} });
			// create Auth user
			const user = await auth.createUser({
				primaryKey: {
					providerId: "username",
					providerUserId: username,
					password
				},
				attributes: {
					username: username,
					cdUserId: newCdUser.id
				}
			});
			// create session
			const session = await auth.createSession(user.userId);

			locals.auth.setSession(session);
		} catch (e) {
			throw e; // rethrow
			return fail(400);
		}
	}
};
