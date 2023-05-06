import { Chess } from '../../node_modules/cm-chess/src/cm-chess/Chess.js';
import { PrismaClient } from '@prisma/client';

export async function importPgn( pgn_content, pgn_filename, prisma, user_id, repForWhite ) {

	const pgn = await prisma.pgn.create({ data: {
		userId: user_id,
		repForWhite: repForWhite,
		filename: pgn_filename,
		content: pgn_content
	} });

	// parse (multi-game) PGN into moves-list
	console.log( pgn_content.length );
	pgn_content = pgn_content.replaceAll( /\r/g, "" );
	console.log( pgn_content.length );
	const pgntexts = split_pgndb_into_pgns( pgn_content );
	const moves = [];
	for ( const pgntext of pgntexts ) {
		const pgntext_fixed = pgntext.replace(/\*\s*$/, '\n'); // remove final '*', maybe cm-chess/chess.js bug makes it cause parser issues?
		const these_moves = singlePgnToMoves( pgntext_fixed, repForWhite );
		moves.push( ...these_moves );
	}

	// insert moves into db
	for ( const move of moves ) {
		move.userId = user_id;
		move.pgns = { connect: [{ id: pgn.id }] };
		await prisma.move.upsert( {
			where: {
				userId_repForWhite_fromFen_toFen: {
					userId: user_id,
					repForWhite: move.repForWhite,
					fromFen: move.fromFen,
					toFen: move.toFen
				}
			},
			create: move,
			update: { pgns: move.pgns }
		});
	}

	return moves.length;
}

// Converts text from single PGN game to a moves-list.
// Exported only as a test utility.
export function singlePgnToMoves( pgn_content, repForWhite ) {
	const chess = new Chess();
	chess.loadPgn( pgn_content ); // TODO: handle unparsable PGNs
	return chessHistoryToMoves( chess.history(), repForWhite );
}

// Traverse all cm-chess moves, including variations, and returns moves-list
function chessHistoryToMoves( history, repForWhite ) {
	const moves = [];
	for ( const move of history ) {
		const ownMove = ( repForWhite && move.color == 'w' || !repForWhite && move.color == 'b' );
		moves.push( {
			repForWhite: repForWhite,
			ownMove: repForWhite && move.color == 'w' || !repForWhite && move.color == 'b',
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
	const regex = /(\[.*?\n\n *\S.*?\n\n)/gs; // Should fail on PGNs with comments with empty lines
	const found = pgn_db.match(regex);
	return found;
}

// Canonicalise FEN by removing last three elements: en passant square, half-move clock and fullmove number. see README
function normalize_fen( fen ) {
	return fen.replace(/ (-|[a-h][1-8]) \d+ \d+$/, '' );
}
