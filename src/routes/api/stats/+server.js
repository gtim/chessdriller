import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
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
	moves.forEach( m => m.isDue = isDue(m,now) );

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

function isDue(move,now) {
	if ( ! move.ownMove ) {
		return false;
	} else if ( move.learningDueTime ) {
		return move.learningDueTime <= now;
	} else if ( move.reviewDueDate ) {
		return move.reviewDueDate <= now; 
	} else {
		throw new Error( 'isDue invalid own/learning/review state for move #'+move.id );
	}
}
