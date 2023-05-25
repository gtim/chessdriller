import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { pgndbToMoves, compareMovesLists } from '$lib/pgnImporter.js';

const prisma = new PrismaClient();

// TODO move most logic to $lib/lichessStudy.js

export async function POST({ locals, params }) {

	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });


	// Get study + update

	const study = await prisma.LichessStudy.findUnique({
		where: { id: +params.studyId },
		select: {
			id: true,
			userId: true,
			lichessId: true,
			included: true,
			repForWhite: true,
			moves: {
				select: {
					id: true,
					repForWhite: true,
					fromFen: true,
					toFen: true,
					studies: { select: { id: true } },
					pgns:    { select: { id: true } }
				}
			},
			updates: {
				select: {
					numNewMoves: true,
					numRemovedMoves: true,
					pgn: true
				}
			}
		}
	});
	if ( study.userId !== user.cdUserId )
		return json({ success: false, message: 'Study does not belong to this user (are you logged in?)' });
	if ( ! study.included )
		return json({ success: false, message: 'Only studies that are part of your repertoire can be updated, please add it first.' });
	if ( study.updates.length == 0 )
		return json({ success: false, message: 'No pre-fetched update available to apply (did you already apply it?)' });

	
	// Find new/removed moves
	
	let updated_moves;
	try {
		updated_moves = pgndbToMoves( study.updates[0].pgn, study.repForWhite );
	} catch(e) {
		return json({
			success: false,
			message: 'Parsing updated PGN failed: ' + e.message
		});
	}
	const { new_moves, removed_moves } = compareMovesLists( study.moves, updated_moves );
	if ( study.updates[0].numNewMoves !== new_moves.length )
		console.log( 'warning: stored numNewMoves different from newly-parsed ('+study.updates[0].numNewMoves+','+new_moves.length+')' );
	if ( study.updates[0].numRemovedMoves !== removed_moves.length )
		console.log( 'warning: stored numRemovedMoves different from newly-parsed ('+study.updates[0].numRemovedMoves+','+removed_moves.length+')' );

	//  Add new moves
	
	let queries = [];
	for ( const move of new_moves ) {
		move.userId = study.userId;
		move.studies = { connect: [{ id: study.id }] };

		queries.push( prisma.Move.upsert( {
			where: {
				userId_repForWhite_fromFen_toFen: {
					userId: move.userId,
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

	// Delete removed moves
	
	for ( const move of removed_moves ) {
		if ( move.pgns.length + move.studies.length == 1 ) {
			// no other PGNs/studies contain this move: soft-delete it
			queries.push( prisma.Move.update({
				where: { id: move.id },
				data: {
					studies: { disconnect: [{ id: study.id }] },
					deleted: true
				}
			}) );
		} else {
			// move in other pgns/studies: just disconnect it from this study
			queries.push( prisma.Move.update({
				where: { id: move.id },
				data: {
					studies: { disconnect: [{ id: study.id }] }
				}
			}) );
		}
	}

	// Remove update

	queries.push( prisma.LichessStudyUpdate.delete({
		where: { studyId: study.id }
	}) );

	// Run transaction
	
	try {
		await prisma.$transaction(queries);
	} catch(e) {
		console.log( 'Exception updating study: ' + e.message );
		throw new Error( e.message );
	}
	return json({ success: true });
	
}
