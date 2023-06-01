/*
 * Inconvenient file with reusable functions handling moves-lists.
 */


// Compare Moves-lists to find added and removed moves
// existing_moves are from the Moves prisma table
// update_moves are from e.g. pgndbToMoves
// both are arrays of at least { repForWhite, fromFen, toFen }
export function compareMovesLists( existing_moves, update_moves ) {
	function movestring( move ) {
		return (move.repForWhite?'w':'b') + ':' + move.fromFen + ':' + move.toFen;
	}
	const existing_movestrings = [...new Set( existing_moves.map(movestring) )];
	const update_movestrings   = [...new Set( update_moves.map(movestring) )];
	const new_moves     = update_moves.filter(   move => ! existing_movestrings.includes(movestring(move)) );
	const removed_moves = existing_moves.filter( move => !   update_movestrings.includes(movestring(move)) );
	return { new_moves, removed_moves };
}


// orphanMoveSoftDeletionsQueries produces soft-delete queries for moves that would be orphaned from a PGN/study removal.
// Helper function for deletePGN and unincludeStudy.
export function orphanMoveSoftDeletionsQueries( moves, prisma ) {
	let queries = [];
	for ( const move of moves ) {
		if ( move.pgns.length + move.studies.length == 1 ) {
			// no other PGNs/studies contain this move: soft-delete it
			queries.push( prisma.Move.update({
				where: { id: move.id },
				data: { deleted: true }
			}) );
		}
	}
	return queries;
}


