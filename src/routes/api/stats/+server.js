import { json, error, fail } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { moveIsDue } from '$lib/scheduler.js';
import { auth } from "$lib/server/lucia";

const prisma = new PrismaClient();

export async function GET({ url, locals }) {

	// session
	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });
	const userId = user.cdUserId;

	// get moves
	const moves = await prisma.Move.findMany({
		where: {
			userId,
			ownMove: true,
			deleted: false
		},
		select: {
			ownMove: true,
			learningDueTime: true,
			reviewDueDate: true
		}
	});

	const now = new Date(); 
	moves.forEach( m => m.isDue = moveIsDue(m,now) );

	return json( {
		success: true,
		stats: { 
			moves_total:    moves.length,
			moves_due:      moves.filter( m => m.isDue ).length,
			moves_learning: moves.filter( m => m.learningDueTime ).length,
			moves_review:   moves.filter( m => m.reviewDueDate ).length
		}
	} );
}
