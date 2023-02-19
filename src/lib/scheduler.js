import { PrismaClient } from '@prisma/client';

export async function getNextLineForStudy( prisma, user_id, last_line = [] ) {

	const moves = await prisma.Move.findMany({
		where: { userId: user_id },
		select: {
			id: true,
			fromFen: true,
			toFen: true,
			moveSan: true,
			ownMove: true,
			repForWhite: true,
			learningDueTime: true,
			reviewDueDate: true
		}
	});
	const now = new Date(); 
	moves.forEach( m => m.isDue = moveIsDue(m,now) );

	const num_due_moves = moves.filter( m => m.isDue ).length;

	const response = {
		line: [],
		start_ix: 0,
		num_due_moves: num_due_moves
	};


	if ( num_due_moves == 0 ) {
		// no due moves
		return response;
	}

	if ( last_line.length ) {
		// just finished another line
		const last_line_repForWhite = moves.find( m => m.id === last_line[0] ).repForWhite;
		const moves_same_rep_as_last = moves.filter( m => m.repForWhite == last_line_repForWhite );
		if ( moves_same_rep_as_last.filter( m => m.isDue ).length ) {
			// there are more due moves for that color's repertoire
			[ response.line, response.start_ix ] = findDueLineWithLatestDeviation( last_line, moves_same_rep_as_last );
			return response;
		}
	}
	
	// build a line from the most due move
	const due_move = mostDueMove(moves);
	const moves_same_rep = moves.filter( m => m.repForWhite == due_move.repForWhite );
	response.line = buildLineBackwards( [due_move], moves_same_rep );
	response.line = continueLineUntilEnd( response.line, moves_same_rep );

	return response;
}

export function moveIsDue( move, now ) {
	if ( ! move.ownMove ) {
		return false;
	} else if ( move.learningDueTime ) {
		return move.learningDueTime <= now;
	} else if ( move.reviewDueDate ) {
		return move.reviewDueDate <= now; 
	} else {
		throw new Error( 'invalid move own/learning/review state in moveIsDue for move #'+move.id );
	}
}


function findDueLineWithLatestDeviation( last_line_ids, all_moves ) {
	let excluded_move_ids = {};
	const last_line_moves = last_line_ids.map( mId => all_moves.find( m => m.id === mId ) );
	for ( let move_ix = last_line_ids.length-2; move_ix >= 0; move_ix-- ) {
		excluded_move_ids[ last_line_ids[move_ix+1] ] = true;
		let [num_due_moves, line] = findContinuationWithMostDueMoves( last_line_moves[move_ix], all_moves, excluded_move_ids );
		if ( num_due_moves > 0 ) {
			const full_line = last_line_moves.slice(0,move_ix).concat( line );
			return [ full_line, move_ix + 1 ];
		}
	}
	throw new Error( 'no due moves found' );
}
function findContinuationWithMostDueMoves( start_move, all_moves, excluded_move_ids ) {
	// Assume no cycles (TODO): directed acyclic graph -> single-path shortest path is straight-forward
	const possible_moves = all_moves.filter( m => m.fromFen === start_move.toFen && ! excluded_move_ids.hasOwnProperty(m.id) );
	if ( possible_moves.length == 0 ) {
		return [start_move.isDue ? 1 : 0, [start_move]];
	} else {
		let max_due_moves = -1;
		let best_continuation = [];
		for ( const possible_move of possible_moves ) {
			const [ possible_move_num_dues, possible_continuation ] = findContinuationWithMostDueMoves( possible_move, all_moves, excluded_move_ids );
			if ( possible_move_num_dues > max_due_moves ) {
				max_due_moves = possible_move_num_dues;
				best_continuation = possible_continuation;
			}
		}
		best_continuation.unshift(start_move);
		return [max_due_moves + ( start_move.isDue ? 1 : 0 ), best_continuation];
	}
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
