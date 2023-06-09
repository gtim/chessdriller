import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { fetchAllStudyChanges } from '$lib/lichessStudy.js';

export async function GET({ locals }) {

	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();

	const cdUser = await prisma.User.findUniqueOrThrow({
		where: { id: user.cdUserId }
	});

	// update studies
	let changes;
	try {
		changes = await fetchAllStudyChanges( user.cdUserId, prisma, cdUser.lichessUsername, cdUser.lichessAccessToken );
	} catch (e) {
		console.warn(e.message);
		return json({ success: false, message: e.message });
	}

	// return study changes
	return json({
		success: true,
		...changes
	});


}
