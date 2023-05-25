import { fetchStudyPGN } from '$lib/lichessApi.js';
import { pgndbToMoves, compareMovesLists } from '$lib/pgnImporter.js';


export async function fetchStudyUpdate( user_id, study_id, prisma, lichess_username, lichess_access_token ) {

	// get existing study

	const study = await prisma.LichessStudy.findUnique({
		where: { id: study_id },
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
	if ( study.userId !== user_id )
		throw new Error('Study does not belong to this user (are you logged in?)');
	if ( ! study.included )
		throw new Error('Only studies that are part of your repertoire can be updated, please add it first.');

	
	// fetch new PGN

	const updated_pgn = await fetchStudyPGN( study.lichessId, lichess_username, lichess_access_token );

	
	// find number of new/removed moves
	
	const updated_moves = pgndbToMoves( updated_pgn, study.repForWhite );
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
	await prisma.LichessStudyUpdate.upsert({
		where: { studyId: study.id },
		update: updated_study,
		create: updated_study
	});


	// Return update stats

	return {
		numNewMoves,
		numNewOwnMoves,
		numRemovedMoves,
		numRemovedOwnMoves
	}

}
