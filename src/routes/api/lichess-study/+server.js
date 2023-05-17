import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

export async function GET({ url, locals }) {
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
				_count: { select: { moves: true } }
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
