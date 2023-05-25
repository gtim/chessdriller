import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { fetchStudiesMetadata, fetchStudyPGN } from '$lib/lichessApi.js';
import { guessColor, makePreviewFen } from '$lib/pgnImporter.js';

export async function GET({ locals }) {

	// get lucia-user from session

	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();


	// fetch existing study IDs from database
	
	const existing_studies = await prisma.LichessStudy.findMany({
		where: { userId: user.cdUserId },
		select: {
			lichessId: true,
			lastModifiedOnLichess: true,
			name: true
		}
	});
	const existing_study_ids = new Set( existing_studies.map( (study) => study.lichessId ) );

	try {

		// fetch study IDs from Lichess

		const cdUser = await prisma.User.findUniqueOrThrow({
			where: { id: user.cdUserId }
		});
		const lichess_studies = await fetchStudiesMetadata( cdUser.lichessUsername, cdUser.lichessAccessToken );

		// if new studies are found, insert them into database

		let num_new_studies = 0;
		for ( const lichess_study of lichess_studies ) {
			if ( ! existing_study_ids.has( lichess_study.id ) ) {
				// new study: insert into database
				console.log( 'new study found: ' + cdUser.lichessUsername + '/' + lichess_study.id );
				const pgn = await fetchStudyPGN( lichess_study.id, cdUser.lichessUsername, cdUser.lichessAccessToken );
				const guessedColor = guessColor(pgn);
				const previewFen = makePreviewFen(pgn);
				await prisma.LichessStudy.create({ data: {
					lichessId: lichess_study.id,
					userId: user.cdUserId,
					lastModifiedOnLichess: new Date(lichess_study.updatedAt),
					name: lichess_study.name,
					pgn,
					guessedColor,
					previewFen
				} } );
				num_new_studies++;
			} else {
				// existing study: check if modified
				const existing_study = existing_studies.find( (study) => study.lichessId === lichess_study.id );
				if ( existing_study.lastModifiedOnLichess < new Date(lichess_study.updatedAt) ) {
					console.log( 'study has been updated: ' + existing_study.name );
				} else {
					console.log( 'not updated: ' + existing_study.name );
				}
				//console.log( '  e:' + existing_study.lastModifiedOnLichess );
				//console.log( '  l:' + new Date( lichess_study.updatedAt ) );
			}
		}

		return json({
			success: true,
			num_new_studies
		});

	} catch (e) {
		console.warn(e.message);
		return json({ success: false, message: e.message });
	}

}
