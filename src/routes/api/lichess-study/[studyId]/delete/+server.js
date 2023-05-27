import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { deleteStudy } from '$lib/lichessStudy.js';

export async function POST({ locals, params }) {

	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();
	
	try {
		await deleteStudy( user.cdUserId, +params.studyId, prisma );
		return json({ success: true });
	} catch (e) {
		return json({
			success: false,
			message: 'Study deletion failed: ' + e.message
		});
	}

}
