/*
 * scheduler.js
 *
 * Logic governing when a move is due for repetition and how to pick a line/variation to practice.
 *
 * Note: some algorithms here are DoS-vulnerable to malign/pathological PGNs.
 *
 */


/*
 * getNextLineForStudy( prisma, user_id, last_line )
 *
 * Next line scheduled for study
 *
 * Input:
 *   movs: all moves belonging to user ID (handled by caller to avoid prisma dependency here)
 *   now: current datetime (new Date())
 *   last_line?: array of move IDs for the last line practiced
 *
 * Output: {
 *   line: array of moves (not just move IDs), starting from the first move 
 *   start_ix: line[start_ix] is the first move to be quizzed (prior moves were part of last line)
 *   num_due_moves: total number of due moves
 * }
 *
 * TODO: handle multiple ownMoves
 */
export async function getNextLineForStudy( moves, now, last_line = [] ) {

	moves.forEach( m => m.isDue = moveIsDue(m,now) );

	const due_moves = moves.filter( m => m.isDue );

	const response = {
		line: [],
		start_ix: 0,
		num_due_moves: due_moves.length
	};


	// No due moves: nothing to practice
	if ( due_moves.length == 0 ) {
		return response;
	}


	// Just finished another line: find the closest line with a due move
	if ( last_line.length ) {
		const last_line_repForWhite = moves.find( m => m.id === last_line[0] ).repForWhite;
		const moves_same_rep_as_last = moves.filter( m => m.repForWhite == last_line_repForWhite );
		if ( moves_same_rep_as_last.filter( m => m.isDue ).length ) {
			// there are more due moves for that color's repertoire
			[ response.line, response.start_ix ] = findDueLineWithLatestDeviation( last_line, moves_same_rep_as_last );
			return response;
		}
	}
	
	// Else: Find the most due move, and find a line including it
	const most_due_move = mostDueMove(due_moves);
	const moves_same_rep = moves.filter( m => m.repForWhite == most_due_move.repForWhite );
	response.line = buildLineBackwards( [most_due_move], moves_same_rep );
	response.line = continueLineUntilEnd( response.line, moves_same_rep );

	return response;
}

/*
 * moveIsDue( move, now )
 *
 * Find whether a move is due at the supplied datetime.
 *
 */
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
// Prefer due moves greedily. (TODO)
// Depth-first search with backtrack when cycle detected.
//
// Return line (array of moves), or null if no line found.
//
// It would be interesting to find the "optimal" line, i.e. with as many due moves as possible. This would be the single-pair longest path of a 0/1-weighted cyclic directed graph, which I'd guess is O(n!)? However a repertoire is small and sparse, and can surely be brute-forced reasonably.
function buildLineBackwards( line, all_moves ) {
	if ( line[0].fromFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq' ) {
		return line;
	}
	const fens_in_line = line.map( m => m.toFen );
	const preceding_moves = all_moves.filter( m =>
		m.toFen === line[0].fromFen // leads to "current" position
		&& ! fens_in_line.includes( m.fromFen ) // FEN not already in line (avoid move repetition)
	);
	shuffleArray( preceding_moves );
	for ( const move_candidate of preceding_moves ) {
		const found_line = buildLineBackwards( [ move_candidate, ...line ], all_moves );
		if ( found_line ) {
			return found_line;
		}
	}
	return null;
}

// Continue a line from its last move until no more moves are found.
// Prefer due moves (TODO), but only through greedy optimization
function continueLineUntilEnd( line, all_moves ) {
	while (true) {
		const possible_succeeding_moves = all_moves.filter( m => m.fromFen === line[line.length-1].toFen );
		if ( possible_succeeding_moves.length == 0 ) {
			return line;
		}
		const fens_in_line = line.map( m => m.fromFen );
		line.push( randomMove( possible_succeeding_moves ) );
		if ( fens_in_line.includes( line[line.length-1].toFen ) ) {
			// repeated position: end
			return line;
		}
	}
}

function randomMove( moves ) {
	return moves[ Math.floor( Math.random()*moves.length ) ];
}

function shuffleArray(array) {
	// Durstenfield
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

// Find the most due card, i.e. the one that was due first.
// Cards in learning count as more due than those in review.
// Expects all input moves to be due.
function mostDueMove( due_moves ) {
	let mdm = null;
	for ( const move of due_moves ) {
		if ( ! move.ownMove ) {
			continue;
		}
		if ( ! mdm ) {
			mdm = move;
		} else if ( move.learningDueTime && ( ! mdm.learningDueTime || mdm.learningDueTime > move.learningDueTime ) ) {
			mdm = move;
		} else if ( move.reviewDueDate && mdm.reviewDueDate && mdm.reviewDueDate > move.reviewDueDate ) {
			mdm = move;
		}
	}
	return mdm;
}
