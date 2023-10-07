import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { deleteStudy } from '$lib/lichessStudy.js';

export async function POST({ locals, params }) {

	const session = await locals.auth.validate();
	if (!session) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();
	
	try {
		await deleteStudy( session.user.cdUserId, +params.studyId, prisma );
		return json({ success: true });
	} catch (e) {
		return json({
			success: false,
			message: 'Study deletion failed: ' + e.message
		});
	}

}
