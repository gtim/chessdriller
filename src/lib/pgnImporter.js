import { Chess } from '../../node_modules/cm-chess/src/cm-chess/Chess.js';
import { PrismaClient } from '@prisma/client';

export async function importPgn( pgn_content, pgn_filename, prisma, user_id, repForWhite ) {

	const pgntexts = split_pgndb_into_pgns( pgn_content );

	const pgn = await prisma.pgn.create({ data: {
		userId: user_id,
		repForWhite: repForWhite,
		filename: pgn_filename,
		content: pgn_content
	} });

	let total_moves_parsed = 0;
	for ( const pgntext of pgntexts ) {
		const pgntext_fixed = pgntext.replace(/\*\s*$/, '\n'); // remove final '*', maybe cm-chess/chess.js bug makes it cause parser issues?
		const chess = new Chess();
		chess.loadPgn( pgntext_fixed ); // TODO: handle unparsable PGNs
		total_moves_parsed += await insert_all_moves( prisma, user_id, pgn.id, repForWhite, chess.history() );
	}

	return total_moves_parsed;

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

// Traverse all variations and insert each move into database.
// Returns the number of moves parsed.
async function insert_all_moves( prisma, user_id, pgn_id, repForWhite, moves ) {
	let num_moves_parsed = 0;
	for ( const move of moves ) {
		const from_fen = normalize_fen( move.previous ? move.previous.fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' );
		const to_fen   = normalize_fen(move.fen);
		const ownMove = ( repForWhite && move.color == 'w' || !repForWhite && move.color == 'b' );
		await prisma.move.upsert( {
			where: {
				userId_repForWhite_fromFen_toFen: {
					userId: user_id,
					repForWhite: repForWhite,
					fromFen: from_fen,
					toFen: to_fen
				}
			},
			create: {
				userId: user_id,
				repForWhite: repForWhite,
				ownMove: ownMove,
				fromFen: from_fen,
				toFen:   to_fen,
				moveSan: move.san,
				pgns: { connect: [{ id: pgn_id }] }
			},
			update: {
				pgns: { connect: [{ id: pgn_id }] }
			}
		});
		num_moves_parsed++;
		// traverse variations.
		// await required to avoid race conditions triggering Prisma Sqlite bug: https://github.com/prisma/prisma/issues/11789
		for ( const variation of move.variations ) {
			num_moves_parsed += await insert_all_moves( prisma, user_id, pgn_id, repForWhite, variation );
		}
	}
	return num_moves_parsed;
}
