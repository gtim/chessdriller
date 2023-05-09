import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { fetchStudyIds, fetchStudy } from '$lib/lichessStudy.js';

export async function GET({ url, locals }) {

	// get lucia-user from session

	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();


	// fetch existing study IDs from database
	
	const existing_studies = await prisma.LichessStudy.findMany({
		where: { userId: user.cdUserId },
		select: { lichessId: true }
	});
	const existing_study_ids = new Set( existing_studies.map( (study) => study.lichessId ) );

	try {

		// fetch study IDs from Lichess

		const cdUser = await prisma.User.findUniqueOrThrow({
			where: { id: user.cdUserId }
		});
		const lichess_study_ids = await fetchStudyIds( cdUser.lichessUsername, cdUser.lichessAccessToken );


		// if new studies are found, insert them into database

		let num_new_studies = 0;
		for ( const lichess_study_id of lichess_study_ids ) {
			if ( ! existing_study_ids.has( lichess_study_id ) ) {
				// new study: insert into database
				console.log( 'new study found: ' + cdUser.lichessUsername + '/' + lichess_study_id );
				const { pgn, lastModified } = await fetchStudy( lichess_study_id, cdUser.lichessUsername, cdUser.lichessAccessToken );
				await prisma.LichessStudy.create({ data: {
					lichessId: lichess_study_id,
					userId: user.cdUserId,
					lastModifiedOnLichess: new Date(lastModified),
					pgn
				} } );
				num_new_studies++;
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
