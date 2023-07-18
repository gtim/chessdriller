/*
 * scheduler.ts
 *
 * Logic governing when a move is due for repetition and how to pick a line/variation to practice.
 *
 */

import type { Move } from '@prisma/client';

export type StudyLineResponse = {
	line: MoveWithPossibleBranches[],
	start_ix: number,
	due_ix: number[],
	num_due_moves: number,
};

// a branch is a choice of moves from the user, e.g. 1. c4 and 1. Nf3 in the White repertoire.
// the first move in a branch is the one that is due and intended for continuation
// TODO: better type name
export type MoveWithPossibleBranches = Move & { branches?: Move[] };

/*
 * getLineForStudy( moves, now, last_line )
 *
 * Next line scheduled for study. Find a line as close to the previous one as possible.
 *
 * Input:
 *   repertoire: all moves belonging to user ID (handled by caller to avoid prisma dependency here)
 *   now: current datetime (new Date())
 *   lastLineIds: array of move IDs for the last line studied
 *
 * Output: {
 *   line: array of moves (not just move IDs), starting from the first move 
 *   start_ix: line[start_ix] is the first move to be quized (prior moves were part of last line)
 *   num_due_moves: total number of due moves
 * }
 *
 * Algorithm:
 *   0. If no last_line was given, go to step 3.
 *   1. Rewind the final move of the last line. 
 *   2. Search breadth-first for a continuation with a due move.
 *      If no continuation is found, go to step 1 and rewind another move.
 *      When one is found, pick it and append to the line.
 *   3. Breadth-first search for a continuation with a due move.
 *      If no continuation is found, pick one randomly and return.
 *      If multiple continuations found at same depth, pick one randomly and repeat.
 *      If a single continuation is found, pick it and repeat.
 *
 * Note: DoS-vulnerable to malign/pathological PGNs. 
 *
 * It would be interesting to find the "optimal" line, i.e. with as many due 
 * moves as possible. This would be the single-pair longest path of a 
 * 0/1-weighted cyclic directed graph, which I'd guess is O(n!)? However a 
 * repertoire is small and sparse, and can surely be brute-forced reasonably.
 *
 */
export async function getLineForStudy( repertoire: Move[], now: Date, lastLineIds: number[] = [] ): Promise<StudyLineResponse> {

	const InitialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq';

	// No due moves: short-circuit 
	const dueMoves = repertoire.filter( m => moveIsDue(m,now) );
	const num_due_moves = dueMoves.length;
	if ( num_due_moves == 0 ) {
		return { line: [], start_ix: 0, due_ix: [], num_due_moves: 0 };
	}

	// Populate line with last line
	let line: Move[] = [];
	for ( const moveId of lastLineIds ) {
		const move = repertoire.find( (m) => m.id === moveId );
		if ( move === undefined ) {
			console.warn( 'missing move in lastLineIds ('+moveId+')');
			line = [];
			break;
		}
		line.push(move);
	}
	// Remove moves from lastLine one by one until a continuation is found
	// (while loop is skipped if no lastLine supplied)
	let lastFinalMove;
	while ( lastFinalMove = line.pop() ) {
		const currentFen = line.length == 0 ? InitialFen : line[line.length-1].toFen;
		const nextMoveIsOwn = lastFinalMove.ownMove;
		const repForWhite = lastFinalMove.repForWhite;
		const continuation = bfsDueContinuationToEnd( repertoire, now, currentFen, repForWhite, nextMoveIsOwn, new Set(lastLineIds) );
		if ( continuation.length > 0 ) {
			line.push( ...continuation );
			const due_ix = lineToDueIx(line,now);
			const start_ix = Math.min( line.length, ...due_ix );
			return { line, start_ix, due_ix, num_due_moves };
		}
	}

	// Search White/Black repertoire from initial position, in random order
	// (note: with lastLine supplied, either W/B will be searched from initial twice after full backtracking)
	let repForWhite = Math.random() > 0.5;
	let nextMoveIsOwn = repForWhite;

	// White or Black (random)
	line = bfsDueContinuationToEnd( repertoire, now, InitialFen, repForWhite, nextMoveIsOwn );
	if ( line.length > 0 ) {
		return { line, start_ix: 0, due_ix: lineToDueIx(line,now), num_due_moves };
	}
	// Black or White
	repForWhite = ! repForWhite;
	nextMoveIsOwn = ! nextMoveIsOwn;
	line = bfsDueContinuationToEnd( repertoire, now, InitialFen, repForWhite, nextMoveIsOwn );
	if ( line.length > 0 ) {
		return { line, start_ix: 0, due_ix: lineToDueIx(line,now), num_due_moves };
	}


	throw new Error( 'No line found despite due moves existing' );
}

// array of indices of the due moves in line
function lineToDueIx( line: MoveWithPossibleBranches[], now: Date ): number[] {
	return line.map( (m,i) => ( moveIsDue(m,now) ? i : -1 ) ).filter( i => i>=0 );
}

function bfsDueContinuationToEnd( repertoire: Move[], now: Date, fen: string, repForWhite: boolean, nextMoveIsOwn: boolean, excludedMoveIds: Set<number> = new Set() ): MoveWithPossibleBranches[] {
	const movesSoFar: Move[] = [];
	// greedily append due moves no more are found
	while ( true ) {
		const nextMoves = bfsDueContinuation( repertoire, now, fen, repForWhite, nextMoveIsOwn, excludedMoveIds );
		if ( nextMoves.length == 0 ) break;
		for ( const move of nextMoves ) {
			movesSoFar.push( move );
			excludedMoveIds.add( move.id );
		}
		const lastAddedMove = nextMoves[nextMoves.length-1];
		fen = lastAddedMove.toFen;
		nextMoveIsOwn = ! lastAddedMove.ownMove;
	}
	// return empty array if no due moves were found
	if ( movesSoFar.length == 0 ) {
		return [];
	}
	// append undue moves until end of line reached
	let nextUndueMove;
	while ( nextUndueMove = randomNextMove( repertoire, fen, repForWhite, nextMoveIsOwn, excludedMoveIds ) ) {
		fen = nextUndueMove.toFen;
		nextMoveIsOwn = ! nextUndueMove.ownMove;
		excludedMoveIds.add( nextUndueMove.id );
		movesSoFar.push( nextUndueMove );
	}
	return movesSoFar;
}

function bfsDueContinuation( repertoire: Move[], now: Date, fen: string, repForWhite: boolean, nextMoveIsOwn: boolean, excludedMoveIds: Set<number> ): MoveWithPossibleBranches[] {

	const initialPossibleMoves: Move[] = repertoire.filter( (m) =>
		m.repForWhite === repForWhite
		&& m.ownMove === nextMoveIsOwn
		&& m.fromFen === fen
		&& ! excludedMoveIds.has( m.id )
	);
	let continuationsNextPly: MoveWithPossibleBranches[][] = includeBranches(initialPossibleMoves).map( (m) => [m] );

	for ( let ply = 0; ply < 1000; ply++ ) {
		if ( continuationsNextPly.length == 0 ) {
			// no due continuation was found at any depth
			return [];
		}
		const continuationsThisPly = continuationsNextPly;
		shuffleArray( continuationsThisPly );
		for ( const continuation of continuationsThisPly ) {
			if ( moveIsDue(continuation[continuation.length-1],now) ) {
				return continuation;
			}
		}
		// no due continuations found this depth: prepare for next ply
		continuationsNextPly = [];
		for ( const continuation of continuationsThisPly ) {
			// TODO: this will probably search both 1. Nf3 d5 2. d4 e6 3. c4 and 1. d4 d5 2. Nf3 e6 3. c4, if only c4 is due
			const lastMoveOfContinuation = continuation[continuation.length-1];
			const nextExcludedMoveIds = new Set([ ...excludedMoveIds, ...continuation.map((m)=>m.id) ]);
			const possibleNextMoves = repertoire.filter( (m) =>
				m.repForWhite === repForWhite
				&& m.ownMove === ! lastMoveOfContinuation.ownMove
				&& m.fromFen === lastMoveOfContinuation.toFen
				&& ! nextExcludedMoveIds.has( m.id )
			);
			for ( const possibleNextMove of includeBranches(possibleNextMoves) ) {
				continuationsNextPly.push( [ ...continuation, possibleNextMove ] );
			}
		}
	}
	throw new Error( 'infinite move search loop; breaking');
}

function includeBranches( moves: Move[] ): MoveWithPossibleBranches[] {
	let movesWithPossibleBranches: MoveWithPossibleBranches[] = [];
	for ( const move of moves ) {
		if ( move.ownMove && moves.length > 1 ) {
			// branching own move 
			const branches = moves.filter( (m) => m !== move );
			const moveWithBranches: MoveWithPossibleBranches = {
				...move,
				branches
			};
			movesWithPossibleBranches.push( moveWithBranches );
		} else {
			// single own move or opponent's move
			movesWithPossibleBranches.push( move );
		}
	}
	return movesWithPossibleBranches;
}

function randomNextMove( repertoire: Move[], fen: string, repForWhite: boolean, nextMoveIsOwn: boolean, excludedMoveIds: Set<number> ): MoveWithPossibleBranches | undefined {
	const possibleMoves: Move[] = repertoire.filter( (m) =>
		m.repForWhite === repForWhite
		&& m.ownMove === nextMoveIsOwn
		&& m.fromFen === fen
		&& ! excludedMoveIds.has( m.id )
	);
	if ( possibleMoves.length == 0 ) {
		return undefined;
	}
	const move: Move = randomElement( possibleMoves );
	if ( move.ownMove && possibleMoves.length > 1 ) {
		const moveWithBranches: MoveWithPossibleBranches = {
			...move,
			branches: possibleMoves.filter( (m) => m !== move ),
		};
		return moveWithBranches;
	} else {
		return move;
	}
}


/*
 * moveIsDue( move, now )
 *
 * Find whether a move is due at the supplied datetime.
 *
 */
export function moveIsDue( move: Move, now: Date ) {
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

function randomElement( arr: any[] ) {
	return arr[ Math.floor( Math.random()*arr.length ) ];
}

function shuffleArray(array: any[]) {
	// Durstenfield
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}
