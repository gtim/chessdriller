import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

export async function GET({ locals }) {
	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();
	try {
		const studies = await prisma.LichessStudy.findMany({
			where: { userId: user.cdUserId },
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
				updates: {
					select: {
						numNewMoves: true,
						numRemovedMoves: true
					}
				},
				_count: {
					select: { 
						moves: { where: { ownMove: true } }
					}
				}
			}
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
