import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { fetchAllStudyChanges } from '$lib/lichessStudy.js';

export async function GET({ locals }) {

	const session = await locals.auth.validate();
	if (!session) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();

	const cdUser = await prisma.User.findUniqueOrThrow({
		where: { id: session.user.cdUserId }
	});

	// update studies
	let changes;
	try {
		changes = await fetchAllStudyChanges( session.user.cdUserId, prisma, cdUser.lichessUsername, cdUser.lichessAccessToken );
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
