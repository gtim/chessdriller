import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { getLineForStudy, getClosestLineForStudy } from '$lib/scheduler.js';

export async function GET({ url, locals }) {

	// session
	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });
	const userId = user.cdUserId;

	const prisma = new PrismaClient();

	const last_line = url.searchParams.has('last') ? JSON.parse( url.searchParams.get('last') ) : [];

	const moves = await prisma.Move.findMany({
		where: { userId, deleted: false }
	});

	const response = last_line.length == 0
	                 ? await getLineForStudy( moves, new Date() )
	                 : await getClosestLineForStudy( moves, new Date(), last_line );

	return json(response);
}

