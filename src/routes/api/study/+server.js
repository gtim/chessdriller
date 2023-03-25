import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { getLineForStudy, getClosestLineForStudy } from '$lib/scheduler.js';

export async function GET({ url }) {
	const user_id = 1; // TODO
	const prisma = new PrismaClient();

	const last_line = url.searchParams.has('last') ? JSON.parse( url.searchParams.get('last') ) : [];

	const moves = await prisma.Move.findMany({
		where: { userId: user_id }
	});

	const response = last_line.length == 0
	                 ? await getLineForStudy( moves, new Date() )
	                 : await getClosestLineForStudy( moves, new Date(), last_line );

	return json(response);
}

