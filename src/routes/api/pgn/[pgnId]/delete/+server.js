import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST({ url, locals, params }) {
	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	const pgn_id = +params.pgnId;

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
		return json({ success: false, message: 'PGN #' + pgn_id + ' not found' });
	if ( pgn.userId != user.cdUserId )
		return json({ success: false, message: 'PGN does not belong to this account (are you logged in?)' });

	// Find moves that should be soft-deleted
	let queries = [];
	let num_deleted_moves = 0;
	for ( const move of pgn.moves ) {
		if ( move.pgns.length == 1 && move.studies.length == 0 ) {
			// no other PGNs/studies contain this move: soft-delete it
			if ( move.pgns[0].id != pgn_id ) {
				console.log( 'Assertion failed in PGN deletion: bad PGN ID ('+pgn_id+','+move.pgns[0].id+')' );
				return json({ success: false, message: 'Assertion failed: bad PGN ID ('+pgn_id+','+move.pgns[0].id+')' });
			}
			queries.push( prisma.Move.update({
				where: { id: move.id },
				data: { 
					deleted: true,
					pgns: { disconnect: [{id:pgn_id}] }
				}
			}) );
			num_deleted_moves++;
		} else if ( move.pgns.length == 0 ) {
			console.log( 'Assertion failed in PGN deletion: move not in PGN (move '+move.id+', PGN '+pgn_id+')' );
			return json({ success: false, message: 'Assertion failed: move not in PGN (move '+move.id+', PGN '+pgn_id+')' });
		} else {
			// Other PGNs/studies contain this move: just disconnect this PGN
		}
	}
	// delete the PGN row
	queries.push( prisma.Pgn.delete({ where: { id: pgn.id } }) );

	try {
		await prisma.$transaction(queries);
	} catch(e) {
		console.log( 'Exception running PGN deletion transaction: ' + e.message );
		return json({ success: false, message: e.message });
	}

	return json({ success: true, num_deleted_moves });
}


