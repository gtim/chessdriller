import { PrismaClient } from '@prisma/client';
import { importPgn } from '$lib/pgnImporter.js';
const prisma = new PrismaClient();

export const actions = {
	default: async ({cookies,request,locals}) => {

		// session
		const { user } = await locals.auth.validateUser();
		if (!user) return json({ success: false, message: 'not logged in' });
		const userId = user.cdUserId;

		const formData = await request.formData();
		const file = formData.get('pgn');
		const repForWhite = formData.get('color') == 'w';


		// TODO: check file size

		const rep_moves_before = await prisma.move.count({
			where: { userId, repForWhite: repForWhite } 
		});

		const total_moves_parsed = await importPgn(
			await file.text(),
			file.name,
			prisma,
			userId,
			repForWhite
		);

		const rep_moves_after = await prisma.move.count({
			where: { userId, repForWhite: repForWhite }
		});

		return {
			success: true,
			num_moves_parsed: total_moves_parsed,
			num_moves_added:  rep_moves_after - rep_moves_before
		};
	}
};

