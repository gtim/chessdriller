/*
 * input:
 * 	color (w/b rep)
 * 	optional: "just studied"
 * 		moves and right/wrong/not-quized for each move
 *
 * return:
 * 	if first call (no "just studied"):
 * 		a line with the "most due" move
 * 	else (TODO):
 * 	return a line that:
 * 		deviates the latest from the one just studied (check last move for deviations, then second last move, etc)
 * 		and contains due move
 *
 * 	          
 *
 * future:
 * 	return a bunch of lines to study, maybe covering the entire due repertoire
 *
 */

import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET({ url }) {
	const userId = 1; // TODO
	const repForWhite = url.searchParams.get('color') == 'w';
	const moves = await prisma.Move.findMany({
		where: {
			userId: userId,
			repForWhite: repForWhite
		},
		select: {
			id: true,
			fromFen: true,
			toFen: true,
			moveSan: true,
			ownMove: true,
			learningDueTime: true,
			reviewDueDate: true
		}
	});

	const due_move = mostDueMove(moves);
	// TODO check if move is due

	let line = buildLineBackwards( [due_move], moves );

	line = continueLineUntilEnd( line, moves );

	return json({line: line});
}

// Build a line from one move by searching backwards to the initial position.
// Prefer due moves (TODO), but only through greedy optimization
function buildLineBackwards( line, all_moves ) {
	const initial_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq';
	while ( line[0].fromFen !== initial_fen ) {
		const possible_preceding_moves = all_moves.filter( m => m.toFen === line[0].fromFen );
		if ( possible_preceding_moves.length == 0 ) {
			throw new Error( 'no preceding moves found for Move #' + line[0].id + ' ('+line[0].moveSan+')!' );
		}
		// TODO check for cycles
		line.unshift( randomMove( possible_preceding_moves ) );
	}
	return line;
}

// Continue a line from its last move until no more moves are found.
// Prefer due moves (TODO), but only through greedy optimization
function continueLineUntilEnd( line, all_moves ) {
	while (true) {
		const possible_succeeding_moves = all_moves.filter( m => m.fromFen === line[line.length-1].toFen );
		if ( possible_succeeding_moves.length == 0 ) {
			return line;
		}
		// TODO check for cycles
		line.push( randomMove( possible_succeeding_moves ) );
	}
}

function randomMove( moves ) {
	return moves[ Math.floor( Math.random()*moves.length ) ];
}

// Find the most due card, i.e. the one that was due first.
// Cards in learning count as more due than those in review.
function mostDueMove( moves ) {
	let mdm = null;
	for ( const move of moves.filter( m => m.ownMove ) ) {
		if ( ! mdm ) {
			mdm = move;
		} else if ( move.learningDueTime && ( ! mdm.learningDueTime || mdm.learningDueTime && mdm.learningDueTime > move.learningDueTime ) ) {
			mdm = move;
		} else if ( move.reviewDueDate && mdm.reviewDueDate && mdm.reviewDueDate > move.reviewDueDate ) {
			mdm = move;
		}
	}
	return mdm;
}
