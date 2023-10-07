import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { fetchStudyUpdate } from '$lib/lichessStudy.js';

const prisma = new PrismaClient();

export async function POST({ locals, params }) {

	const session = await locals.auth.validate();
	if (!session) return json({ success: false, message: 'not logged in' });

	const cdUser = await prisma.User.findUniqueOrThrow({
		where: { id: session.user.cdUserId }
	});

	try {
		const update = await fetchStudyUpdate( session.user.cdUserId, +params.studyId, prisma, cdUser.lichessUsername, cdUser.lichessAccessToken );
		return json({
			success: true,
			update
		});
	} catch (e) {
		return json({
			success: false,
			message: 'Fetching study update failed: ' + e.message
		});
	}

}
