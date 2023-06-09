import { redirect } from "@sveltejs/kit";
import { fetchAllStudyChangesUnlessFetchedRecently } from '$lib/lichessStudy.js';
import { PrismaClient } from '@prisma/client';

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/join"); // force login

	// fetch lichess study updates
	const prisma = new PrismaClient();
	try {
		await fetchAllStudyChangesUnlessFetchedRecently( user.cdUserId, prisma, 5*60 );
	} catch (e) {
		console.warn('could not fetch study changes from /study:' + e.message);
	}

	return { user };
};
