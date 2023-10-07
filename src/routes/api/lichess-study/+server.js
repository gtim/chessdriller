import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

export async function GET({ locals }) {
	const session = await locals.auth.validate();
	if (!session) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();
	try {
		const studies = await prisma.LichessStudy.findMany({
			where: { userId: session.user.cdUserId },
			select: {
				id: true, 
				lichessId: true,
				name: true,
				lastModifiedOnLichess: true,
				lastFetched: true,
				included: true,
				repForWhite: true,
				guessedColor: true,
				previewFen: true,
				hidden: true,
				removedOnLichess: true,
				updates: {
					select: {
						numNewMoves: true,
						numNewOwnMoves: true,
						numRemovedMoves: true,
						numRemovedOwnMoves: true
					}
				},
				_count: {
					select: { 
						moves: { where: { ownMove: true } }
					}
				}
			}
		});
		studies.forEach( (study) => {
			study.numOwnMoves = study._count.moves;
			delete study._count;
		});
		return json({
			success: true, 
			studies
		});
	} catch(e) {
		return json({
			success: false,
			message: e.message
		});
	}
}
