import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { includeStudy } from '$lib/lichessStudy.js';

export async function POST({ locals, params }) {
	const session = await locals.auth.validate();
	if (!session) return json({ success: false, message: 'not logged in' });

	if ( params.color !== 'white' && params.color !== 'black' ) {
		return json({ success: false, message: 'invalid color: ' + params.color });
	}
	const repForWhite = params.color === 'white';

	try {
		const prisma = new PrismaClient();
		includeStudy( +params.studyId, prisma, session.user.cdUserId, repForWhite );
	} catch(e) {
		return json({
			success: false,
			message: e.message
		});
	}
	return json({ success: true });
}

