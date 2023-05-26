import { fetchStudy, fetchStudiesMetadata } from '$lib/lichessApi.js';
import { pgndbToMoves, compareMovesLists, guessColor, makePreviewFen } from '$lib/pgnImporter.js';

// fetchAllStudyChanges
// Synchronise user's studies with Lichess by:
// - fetching any new studies
// - fetching updates to any studies that have been modified (applied separately)
// - marking removed studies (TODO not implemented)

export async function fetchAllStudyChanges( user_id, prisma, lichess_username, lichess_access_token ) {
	
	// fetch existing study IDs from database
	
	const existing_studies = await prisma.LichessStudy.findMany({
		where: { userId: user_id },
		select: {
			id: true,
			lichessId: true,
			lastModifiedOnLichess: true,
			lastFetched: true,
			name: true,
			included: true,
			hidden: true,
			updates: {
				select: {
					fetched: true
				}
			}
		}
	});
	const existing_study_ids = new Set( existing_studies.map( (study) => study.lichessId ) );

	
	// fetch study IDs from Lichess

	const lichess_studies = await fetchStudiesMetadata( lichess_username, lichess_access_token );


	// if new studies are found, insert them into database

	let num_new_studies = 0;
	let num_updates_fetched = 0;
	for ( const lichess_study of lichess_studies ) {
		if ( ! existing_study_ids.has( lichess_study.id ) ) {
			// new study: insert into database
			const { pgn } = await fetchStudy( lichess_study.id, lichess_username, lichess_access_token );
			const guessedColor = guessColor(pgn);
			const previewFen = makePreviewFen(pgn);
			await prisma.LichessStudy.create({ data: {
				lichessId: lichess_study.id,
				userId: user_id,
				lastModifiedOnLichess: new Date(lichess_study.updatedAt),
				name: lichess_study.name,
				pgn,
				guessedColor,
				previewFen
			} } );
			num_new_studies++;
		} else {
			// existing study: check if modified
			// NOTE: Lichess does not update timestamp for sync-disabled studies, see lila issue #12882
			const existing_study = existing_studies.find( (study) => study.lichessId === lichess_study.id );
			const lichess_last_modified = new Date(lichess_study.updatedAt);
			const has_newer_version_on_lichess = existing_study.lastFetched < lichess_last_modified;
			const has_current_update_fetched = existing_study.updates.length && existing_study.updates[0].fetched >= lichess_last_modified;
			if ( has_newer_version_on_lichess && ! has_current_update_fetched ) {
				if ( existing_study.included ) {
					// Study in repertoire: fetch update, apply separately
					await fetchStudyUpdate( user_id, existing_study.id, prisma, lichess_username, lichess_access_token );
					num_updates_fetched++;
				} else if ( ! existing_study.hidden ) {
					// Study not in repertoire: fetch update and auto-apply (TODO not implemented)
				} else {
					// study hidden: ignore any changes
				}
			}
		}
	}

	return {
		num_new_studies,
		num_updates_fetched
	};
}



// fetchStudyUpdate
// Fetch the latest Lichess version of an existing study.
// Update is stored as LichessStudyUpdate and applied to the LichessStudy row separately.

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

	const { pgn, lastModified } = await fetchStudy( study.lichessId, lichess_username, lichess_access_token );

	
	// find number of new/removed moves
	
	const updated_moves = pgndbToMoves( pgn, study.repForWhite );
	const { new_moves, removed_moves } = compareMovesLists( study.moves, updated_moves );

	const numNewMoves = new_moves.length;
	const numRemovedMoves = removed_moves.length;
	const numNewOwnMoves = new_moves.filter(m=>m.ownMove).length;
	const numRemovedOwnMoves = removed_moves.filter(m=>m.ownMove).length;


	// insert update into database

	const updated_study = {
		studyId: study.id,
		fetched: new Date(),
		lastModifiedOnLichess: new Date(lastModified),
		numNewMoves,
		numNewOwnMoves,
		numRemovedMoves,
		numRemovedOwnMoves,
		pgn
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
