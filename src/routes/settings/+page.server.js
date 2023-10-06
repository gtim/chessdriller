import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";
import { PrismaClient } from '@prisma/client';

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/join");

	const prisma = new PrismaClient();
	const cdUser = await prisma.User.findUniqueOrThrow({
		where: { id: user.cdUserId },
		select: {
			lichessUsername: true,
		}
	});

	return {
		lichessUsername: cdUser.lichessUsername
	};
};


export const actions = {
	default: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
	}
};
