import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";
import { PrismaClient } from '@prisma/client';

export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/join");

	const prisma = new PrismaClient();
	const cdUser = await prisma.User.findUniqueOrThrow({
		where: { id: session.user.cdUserId },
		select: {
			lichessUsername: true,
			settingsStudyDisplayLineSource: true,
		}
	});

	return {
		user: cdUser
	};
};


export const actions = {
	logoff: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId);
		locals.auth.setSession(null);
	},
	update: async ({ locals, request }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		const data = await request.formData();
		console.log('upd: ' + data.get('settingsStudyDisplayLineSource'));

		const prisma = new PrismaClient();
		await prisma.User.update({
			where: { id: session.user.cdUserId },
			data: {
				settingsStudyDisplayLineSource: !! data.get('settingsStudyDisplayLineSource' ),
			}
		});
	}
};
