import { redirect } from "@sveltejs/kit";
import { fetchAllStudyChangesUnlessFetchedRecently } from '$lib/lichessStudy.js';
import { PrismaClient } from '@prisma/client';

export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/");

	// fetch lichess study updates
	const prisma = new PrismaClient();
	try {
		await fetchAllStudyChangesUnlessFetchedRecently( session.user.cdUserId, prisma, 5*60 );
	} catch (e) {
		console.warn('could not fetch study changes from /study:' + e.message);
	}

	// fetch settings
	const cdUser = await prisma.User.findUniqueOrThrow({
		where: { id: session.user.cdUserId },
		select: {
			settingsStudyDisplayLineSource: true,
		}
	});
	
	return { user: cdUser };
};
