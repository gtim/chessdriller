import { Chess } from '../../node_modules/cm-chess/src/Chess.js';

export async function includeStudy( study_id, prisma, user_id, repForWhite ) {
	const study = await prisma.LichessStudy.findUniqueOrThrow({
		where: { id: study_id }
	});
	if ( study.userId != user_id ) 
		throw new Error( 'Adding Lichess study failed: user ID does not match' );
	if ( study.hidden )
		throw new Error( 'Adding Lichess study failed: can\'t import hidden study, unhide it first' );
	if ( study.included )
		throw new Error( 'Adding Lichess study failed: study is already included' );
	
	// parse PGN
	const moves = pgndbToMoves( study.pgn, repForWhite );

	// insert moves
	let queries = [];
	for ( const move of moves ) {
		move.userId = user_id;
		move.studies = { connect: [{ id: study_id }] };
		queries.push( prisma.move.upsert( {
			where: {
				userId_repForWhite_fromFen_toFen: {
					userId: user_id,
					repForWhite: move.repForWhite,
					fromFen: move.fromFen,
					toFen: move.toFen
				}
			},
			create: move,
			update: {
				studies: move.studies,
				deleted: false
			}
		}) );
	}

	// update study
	queries.push( prisma.LichessStudy.update({
		where: { id: study_id },
		data: {
			included: true,
			repForWhite
		}
	}) );

	// run transaction
	try {
		await prisma.$transaction(queries);
	} catch(e) {
		console.log( 'Exception inserting study moves into database: ' + e.message );
		throw new Error( 'Exception inserting moves into database: ' + e.message );
	}
}

export async function importPgn( pgn_content, pgn_filename, prisma, user_id, repForWhite ) {

	const pgn = await prisma.pgn.create({ data: {
		userId: user_id,
		repForWhite: repForWhite,
		filename: pgn_filename,
		content: pgn_content
	} });

	// parse (multi-game) PGN into moves-list
	const moves = pgndbToMoves( pgn_content, repForWhite );

	// insert moves into db
	let queries = [];
	for ( const move of moves ) {
		move.userId = user_id;
		move.pgns = { connect: [{ id: pgn.id }] };
		queries.push( prisma.move.upsert( {
			where: {
				userId_repForWhite_fromFen_toFen: {
					userId: user_id,
					repForWhite: move.repForWhite,
					fromFen: move.fromFen,
					toFen: move.toFen
				}
			},
			create: move,
			update: {
				pgns: move.pgns,
				deleted: false
			}
		}) );
	}

	try {
		if ( queries.length > 0 ) {
			await prisma.$transaction(queries);
		}
	} catch(e) {
		console.log( 'Exception inserting PGN moves into database: ' + e.message );
		throw new Error( 'Exception inserting moves into database: ' + e.message );
	}

	return moves.length;
}

// Deletes a PGN.
// Soft-deletes all moves that are not in another PGN/Study.
// Returns the number of deleted moves.
export async function deletePgn( pgn_id, user_id, prisma ) {
	
	// get PGN and all moves
	const pgn = await prisma.Pgn.findUnique( {
		where: { id: pgn_id },
		include: {
			moves: {
				select: {
					id: true,
					pgns:    { select: {id:true} },
					studies: { select: {id:true} }
				}
			},
		}
	});
	if ( ! pgn )
		throw new Error( 'PGN #' + pgn_id + ' not found' );
	if ( pgn.userId != user_id )
		throw new Error( 'PGN does not belong to this account (are you logged in?)' );
	
	// Soft-delete moves
	let queries = orphanMoveSoftDeletionsQueries( pgn.moves, prisma );
	const num_deleted_moves = queries.length;

	// Delete the PGN
	queries.push( prisma.Pgn.delete({ where: { id: pgn.id } }) );

	// Run transaction
	try {
		await prisma.$transaction(queries);
	} catch(e) {
		console.log( 'Exception running PGN deletion transaction: ' + e.message );
		throw new Error( e.message );
	}

	return num_deleted_moves;
}

// Unincludes a PGN, so that it is no longer part of the repertoire.
// Soft-deletes all moves that are not in another PGN/Study.
// Returns the number of deleted moves.
export async function unincludeStudy( study_id, user_id, prisma ) {
	
	// get study and all moves
	const study = await prisma.LichessStudy.findUnique( {
		where: { id: study_id },
		include: {
			moves: {
				select: {
					id: true,
					pgns:    { select: {id:true} },
					studies: { select: {id:true} }
				}
			},
		}
	});
	if ( ! study )
		throw new Error( 'Study #' + study_id + ' not found' );
	if ( study.userId != user_id )
		throw new Error( 'Study does not belong to this account (are you logged in?)' );
	
	// Soft-delete moves
	let queries = orphanMoveSoftDeletionsQueries( study.moves, prisma );
	const num_deleted_moves = queries.length;

	// Set the study to not included
	queries.push( prisma.LichessStudy.update({
		where: { id: study_id },
		data: { included: false }
	}) );

	// Run transaction
	try {
		await prisma.$transaction(queries);
	} catch(e) {
		console.log( 'Exception running study removal transaction: ' + e.message );
		throw new Error( e.message );
	}

	return num_deleted_moves;
}

// orphanMoveSoftDeletionsQueries produces soft-delete queries for moves that would be orphaned from a PGN/study removal.
// Helper function for deletePGN and unincludeStudy.
function orphanMoveSoftDeletionsQueries( moves, prisma ) {
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

// Convert PGN database file (multiple PGNs) to a moves-list.
export function pgndbToMoves( pgndb, repForWhite ) {
	const pgntexts = split_pgndb_into_pgns( pgndb );
	return pgntexts.map( (pgn) => singlePgnToMoves( pgn, repForWhite ) ).flat();
}

// Converts text from single PGN game to a moves-list.
// Exported only as a test utility.
export function singlePgnToMoves( pgn_content, repForWhite ) {
	const chess = singlePgnToCMChess( pgn_content );
	return chessHistoryToMoves( chess.history(), repForWhite );
}

function singlePgnToCMChess( pgn_content ) {

	// remove comments due to issues parsing PGNs with two sequential comments
	// unit tests: "two comments after final move", "two comments before variant", "two comments before variant thrice"
	// TODO investigate whether this is a cm-pgn bug 
	pgn_content = pgn_content.replaceAll(/\{[^{}]*\}/g, '');

	// remove final '*', maybe cm-chess/chess.js bug makes it cause parser issues?
	pgn_content = pgn_content.replace(/\*\s*$/, '\n');

	const chess = new Chess();
	chess.loadPgn( pgn_content ); // TODO: handle unparsable PGNs
	return chess;
}

// Traverse all cm-chess moves, including variations, and returns moves-list
function chessHistoryToMoves( history, repForWhite ) {
	const moves = [];
	for ( const move of history ) {
		const ownMove = ( repForWhite && move.color == 'w' || !repForWhite && move.color == 'b' );
		moves.push( {
			repForWhite,
			ownMove,
			fromFen: normalize_fen( move.previous ? move.previous.fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' ),
			toFen:   normalize_fen(move.fen),
			moveSan: move.san,
		} );
		// traverse variations
		for ( const variation of move.variations ) {
			const variation_moves = chessHistoryToMoves( variation, repForWhite );
			moves.push( ...variation_moves );
		}
	}
	return moves;
}

// A PGN database file can contain multiple PGNs: http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c8
// Since chess.js and cm-chess don't support multiple PGNs, the file is split here. The spec points out that it is simple enough that a full-blown parser is not needed, but it remains to be seen whether kinda-complying PGNs in the wild will cause trouble. Ideally, this would be solved in cm-chess (or chess.js).
function split_pgndb_into_pgns( pgn_db ) {
	pgn_db = pgn_db.replaceAll( /\r/g, "" );
	const regex = /(\[.*?\n\n *\S.*?\n\n)/gs; // Should fail on PGNs with comments with empty lines
	const found = pgn_db.match(regex);
	return found;
}

// Canonicalise FEN by removing last three elements: en passant square, half-move clock and fullmove number. see README
function normalize_fen( fen ) {
	return fen.replace(/ (-|[a-h][1-8]) \d+ \d+$/, '' );
}

// Guess whether PGN is for white or black.
// Returns w (white), b (black) or u (unknown)
export function guessColor( pgn_db ) {
	const pgntexts = split_pgndb_into_pgns( pgn_db );
	let moves_as_white, moves_as_black;
	try {
		moves_as_white = pgntexts.map( (pgn) => singlePgnToMoves( pgn, true  ) ).flat();
		moves_as_black = pgntexts.map( (pgn) => singlePgnToMoves( pgn, false ) ).flat();
	} catch (e) {
		console.log( 'warning: guessColor failed, returning unknown. ' + e.message );
		return 'u';
	}
	const num_splits_as_white = num_own_splits(moves_as_white);
	const num_splits_as_black = num_own_splits(moves_as_black);
	if ( num_splits_as_white > num_splits_as_black ) {
		return 'b';
	} else if ( num_splits_as_black > num_splits_as_white ) {
		return 'w';
	} else {
		return 'u';
	}
}
function num_own_splits(moves) {
	let num_moves_from_fen = {};
	for ( const move of moves.filter( (m) => m.ownMove ) ) {
		num_moves_from_fen[ move.fromFen ] = ( num_moves_from_fen[ move.fromFen ] ?? 0 ) + 1;
	}
	const splits = Object.values(num_moves_from_fen).filter( (num) => num > 1 );
	return splits.length;
}

// Generate the preview FEN from move n of the first chapter
export function makePreviewFen( pgn_db ) {
	const pgntexts = split_pgndb_into_pgns( pgn_db );
	const pgn_first_chapter = pgntexts[0];
	try {
		const chess = singlePgnToCMChess( pgn_first_chapter );
		const preview_move_i = Math.min( 4, chess.pgn.history.moves.length ) - 1;
		return chess.pgn.history.moves[ preview_move_i ].fen;
	} catch (e) {
		console.log( 'warning: makePreviewFen failed, returning origin position. ' + e.message );
		return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	}
}

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
