import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { fetchStudyPGN } from '$lib/lichessStudy.js';
import { pgndbToMoves } from '$lib/pgnImporter.js';

const prisma = new PrismaClient();

export async function POST({ locals, params }) {

	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	const cdUser = await prisma.User.findUniqueOrThrow({
		where: { id: user.cdUserId }
	});

	// fetch existing study

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
					repForWhite: true,
					fromFen: true,
					toFen: true
				}
			}
		}
	});
	if ( study.userId !== user.cdUserId ) {
		return json({ success: false, message: 'Study does not belong to this user (are you logged in?)' });
	}
	if ( ! study.included ) {
		return json({ success: false, message: 'Only studies that are part of your repertoire can be updated, please add it first.' });
	}

	// fetch new PGN

	const updated_pgn = await fetchStudyPGN( study.lichessId, cdUser.lichessUsername, cdUser.lichessAccessToken );

	// find number of new/removed moves
	
	let updated_moves;
	try {
		updated_moves = pgndbToMoves( updated_pgn, study.repForWhite );
	} catch(e) {
		return json({
			success: false,
			message: 'Parsing updated PGN failed: ' + e.message
		});
	}
	const { numNewMoves, numRemovedMoves } = compareMoves( study, updated_moves );

	// insert update into database

	const updated_study = {
		studyId: study.id,
		fetched: new Date(),
		numNewMoves,
		numRemovedMoves,
		pgn: updated_pgn
	};
	try {
		await prisma.LichessStudyUpdate.upsert({
			where: { studyId: study.id },
			update: updated_study,
			create: updated_study
		});
	} catch(e) {
		return json({
			success: false,
			message: 'Storing update failed: ' + e.message
		});
	}


	return json({
		success: true,
		update: {
			numNewMoves,
			numRemovedMoves
		}
	});

}

function compareMoves( study, updated_moves ) {
	// convert each move to a movestring for simple comparison
	// Set ensures unique movestrings and fast lookup.
	const existing_movestrings = [...new Set( study.moves.map(   (m) => (m.repForWhite?'w':'b') + ':' + m.fromFen + ':' + m.toFen ) )];
	const updated_movestrings =  [...new Set( updated_moves.map( (m) => (m.repForWhite?'w':'b') + ':' + m.fromFen + ':' + m.toFen ) )];
	const new_movestrings     =  updated_movestrings.filter( ms => ! existing_movestrings.includes(ms) );
	const removed_movestrings = existing_movestrings.filter( ms => !  updated_movestrings.includes(ms) );
	return {
		numNewMoves: new_movestrings.length,
		numRemovedMoves: removed_movestrings.length
	};
}
