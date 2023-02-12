import { Chess } from '../../../node_modules/cm-chess/src/cm-chess/Chess.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const actions = {
	default: async ({cookies,request}) => {
		const formData = await request.formData();
		const file = formData.get('pgn');
		const forWhite = false;
		// TODO: check file size

		const pgndb = await file.text();
		const pgntexts = split_pgndb_into_pgns( pgndb );
		const pgn = await prisma.pgn.create({ data: {
			userId: 1, //TODO
			forWhite: forWhite,
			filename: file.name,
			content: pgndb
		} });
		for ( const pgntext of pgntexts ) {
			const pgntext_fixed = pgntext.replace(/\*\s*$/, '\n'); // remove final '*', maybe cm-chess/chess.js bug makes it cause parser issues?
			const chess = new Chess();
			chess.loadPgn( pgntext_fixed ); // TODO: handle unparsable PGNs
			await insert_all_moves( pgn.id, forWhite, chess.history() );
		}

		return { success: true };
	}
};

// A PGN database file can contain multiple PGNs: http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c8
// Since chess.js and cm-chess don't support multiple PGNs, the file is split here. The spec points out that it is simple enough that a full-blown parser is not needed, but it remains to be seen whether kinda-complying PGNs in the wild will cause trouble. Ideally, this would be solved in cm-chess (or chess.js).
function split_pgndb_into_pgns( pgn_db ) {
	const regex = /(\[.*?\n\n *\S.*?\n)/gs;
	const found = pgn_db.match(regex);
	return found;
}

// Canonicalise FEN by removing last three elements: en passant square, half-move clock and fullmove number. see README
function normalize_fen( fen ) {
	return fen.replace(/(-|[a-h][1-8]) \d+ \d+$/, '' );
}

// Traverse all variations and insert each move into database
async function insert_all_moves( pgn_id, forWhite, moves ) {
	for ( const move of moves ) {
		const from_fen = normalize_fen( move.previous ? move.previous.fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' );
		const to_fen   = normalize_fen(move.fen);
		await prisma.move.upsert( {
			where: {
				userId_forWhite_fromFen_toFen: {
					userId: 1, //TODO
					forWhite: forWhite,
					fromFen: from_fen,
					toFen: to_fen
				}
			},
			create: {
				userId: 1, //TODO
				forWhite: forWhite,
				fromFen: from_fen,
				toFen:   to_fen,
				moveSan: move.san,
				pgns: { connect: [{ id: pgn_id }] }
			},
			update: {
				pgns: { connect: [{ id: pgn_id }] }
			}
		});
		// traverse variations.
		// await required to avoid race conditions triggering Prisma Sqlite bug: https://github.com/prisma/prisma/issues/11789
		for ( const variation of move.variations ) {
			await insert_all_moves( pgn_id, forWhite, variation );
		}
	}
}
