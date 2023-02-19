import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { moveIsDue } from '$lib/scheduler.js';
const prisma = new PrismaClient();

export async function GET({ url }) {
	const userId = 1; // TODO
	const moves = await prisma.Move.findMany({
		where: {
			userId: userId,
			ownMove: true
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
