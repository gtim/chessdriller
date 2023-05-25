import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { fetchStudyPGN } from '$lib/lichessApi.js';
import { pgndbToMoves, compareMovesLists } from '$lib/pgnImporter.js';

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
					ownMove: true,
					fromFen: true,
					toFen: true
				}
			}
		}
	});
	if ( study.userId !== user.cdUserId )
		return json({ success: false, message: 'Study does not belong to this user (are you logged in?)' });
	if ( ! study.included )
		return json({ success: false, message: 'Only studies that are part of your repertoire can be updated, please add it first.' });

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
	const { new_moves, removed_moves } = compareMovesLists( study.moves, updated_moves );
	const numNewMoves = new_moves.length;
	const numRemovedMoves = removed_moves.length;
	const numNewOwnMoves = new_moves.filter(m=>m.ownMove).length;
	const numRemovedOwnMoves = removed_moves.filter(m=>m.ownMove).length;

	// insert update into database

	const updated_study = {
		studyId: study.id,
		fetched: new Date(),
		numNewMoves,
		numNewOwnMoves,
		numRemovedMoves,
		numRemovedOwnMoves,
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
			numNewOwnMoves,
			numRemovedMoves,
			numRemovedOwnMoves
		}
	});

}
