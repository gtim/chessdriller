import { fetchStudy, fetchStudiesMetadata } from '$lib/lichessApi.js';
import { pgndbToMoves, compareMovesLists, guessColor, makePreviewFen, unincludeStudy } from '$lib/pgnImporter.js';

// fetchAllStudyChanges
// Synchronise user's studies with Lichess by:
// - fetching any new studies
// - fetching updates to any studies that have been modified (applied separately)
// - marking studies removed on Lichess
// - renaming studies renamed on Lichess

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
			removedOnLichess: true,
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
	const lichess_study_ids = new Set( lichess_studies.map( (study) => study.id ) );


	// if new studies are found, insert them into database

	let num_new_studies = 0;
	let num_updates_fetched = 0;
	let num_renamed_studies = 0;
	let num_removed_studies = 0;
	let queries = [];
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
			// existing study
			const existing_study = existing_studies.find( (study) => study.lichessId === lichess_study.id );
			// ensure not removedOnLichess
			if ( existing_study.removedOnLichess ) {
				queries.push( prisma.LichessStudy.update({
					where: { id: existing_study.id },
					data: { removedOnLichess: false }
				}) );
			}
			// update name
			if ( existing_study.name !== lichess_study.name ) {
				queries.push( prisma.LichessStudy.update({
					where: { id: existing_study.id },
					data: { name: lichess_study.name }
				}) );
				num_renamed_studies++;
			}
			// check if PGN was modified
			// NOTE: Lichess does not update timestamp for sync-disabled studies, see lila issue #12882
			const lichess_last_modified = new Date(lichess_study.updatedAt);
			const has_newer_version_on_lichess = existing_study.lastFetched < lichess_last_modified;
			const has_current_update_fetched = existing_study.updates.length && existing_study.updates[0].fetched >= lichess_last_modified;
			if ( has_newer_version_on_lichess && ! has_current_update_fetched ) {
				if ( existing_study.included ) {
					// Study in repertoire: fetch update, apply separately
					await fetchStudyUpdate( user_id, existing_study.id, prisma, lichess_username, lichess_access_token );
					num_updates_fetched++;
				} else if ( ! existing_study.hidden ) {
					// Study not in repertoire: fetch update and auto-apply
					await updateUnincludedStudy( user_id, existing_study.id, prisma, lichess_username, lichess_access_token );
					num_updates_fetched++;
				} else {
					// study hidden: ignore any changes
				}
			}
		}
	}

	// find deleted studies
	for ( const existing_study of existing_studies ) {
		if ( ! lichess_study_ids.has( existing_study.lichessId ) ) {
			// study not found on lichess anymore: remove it
			if ( existing_study.included ) {
				// Study in repertoire: note deletion, apply separately
				if ( ! existing_study.removedOnLichess ) {
					queries.push( prisma.LichessStudy.update({
						where: { id: existing_study.id },
						data: { removedOnLichess: true }
					}) );
					num_removed_studies++;
				}
			} else {
				// Study not included: delete immediately
				queries.push( prisma.LichessStudy.delete({
					where: { id: existing_study.id }
				}) );
				num_removed_studies++;
			}
		}
	}

	// run all queries as single transaction, except move updates, which are performed above
	try {
		await prisma.$transaction(queries);
	} catch(e) {
		throw new Error( 'Exception renaming study: ' + e.message );
		num_renamed_studies = 0;
		num_removed_studies = 0;
	}

	return {
		num_new_studies,
		num_updates_fetched,
		num_renamed_studies,
		num_removed_studies
	};
}


// fetchStudyUpdate
// Fetch the latest Lichess version of an existing study.
// Update is stored as LichessStudyUpdate and applied to the LichessStudy row separately.
// Only for studies included in repertoire. Unincluded studies are updated directly with updateUnincludedStudy.

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
		throw new Error('Only studies that are part of your repertoire can be updated with fetchStudyUpdate, use updateUnincludedStudy.');

	
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


// updateUnincludedStudy
// Updates an unincluded or hidden study. The LichessStudy is directly updated.

async function updateUnincludedStudy( user_id, study_id, prisma, lichess_username, lichess_access_token ) {
	const study = await prisma.LichessStudy.findUnique({
		where: { id: study_id },
		select: {
			id: true,
			userId: true,
			lichessId: true,
			included: true
		}
	});
	if ( study.userId !== user_id )
		throw new Error('Study does not belong to this user (are you logged in?)');
	if ( study.included )
		throw new Error('Studies that are part of your repertoire cannot be updated with updateUnincludedStudy, use fetchStudyUpdate.');

	const { pgn, lastModified } = await fetchStudy( study.lichessId, lichess_username, lichess_access_token );
	await prisma.LichessStudy.update({
		where: { id: study.id },
		data: {
			lastModifiedOnLichess: new Date(lastModified),
			lastFetched: new Date(),
			pgn: pgn
		}
	});
	return;
}

// Delete a study completely.
// If included in repertoire, uninclude it first.
export async function deleteStudy( user_id, study_id, prisma ) {
	const study = await prisma.LichessStudy.findUnique({
		where: { id: study_id },
		select: {
			userId: true,
			included: true
		}
	});
	if ( study.userId !== user_id )
		throw new Error('Study does not belong to this user (are you logged in?)');

	if ( study.included ) {
		await unincludeStudy( study_id, user_id, prisma );
	}

	await prisma.LichessStudy.delete({
		where: { id: study_id }
	});
}
