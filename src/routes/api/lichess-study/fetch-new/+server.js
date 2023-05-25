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

	try {
		const changes = await fetchAllStudyChanges( user.cdUserId, prisma, cdUser.lichessUsername, cdUser.lichessAccessToken );
		return json({
			success: true,
			...changes
		});

	} catch (e) {
		console.warn(e.message);
		return json({ success: false, message: e.message });
	}

}
