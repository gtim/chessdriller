import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { getLineForStudy } from '$lib/scheduler';

export async function GET({ url, locals }) {

	// session
	const session = await locals.auth.validate();
	if (!session) return json({ success: false, message: 'not logged in' });
	const userId = session.user.cdUserId;

	const prisma = new PrismaClient();

	const lastLineJson = url.searchParams.get('last');
	const lastLine = lastLineJson === null ? [] : JSON.parse( lastLineJson );

	const moves = await prisma.move.findMany({
		where: { userId, deleted: false }
	});

	const response = await getLineForStudy( moves, new Date(), lastLine );

	return json(response);
}

