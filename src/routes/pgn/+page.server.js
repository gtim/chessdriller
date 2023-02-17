import { PrismaClient } from '@prisma/client';
import { importPgn } from '$lib/pgnImporter.js';
const prisma = new PrismaClient();

export const actions = {
	default: async ({cookies,request}) => {
		const formData = await request.formData();
		const file = formData.get('pgn');
		const repForWhite = formData.get('color') == 'w';
		const user_id = 1; // TODO
		// TODO: check file size

		const rep_moves_before = await prisma.move.count({
			where: { userId: user_id, repForWhite: repForWhite } 
		});

		const total_moves_parsed = await importPgn( file, prisma, user_id, repForWhite );

		const rep_moves_after = await prisma.move.count({
			where: { userId: user_id, repForWhite: repForWhite }
		});

		return {
			success: true,
			num_moves_parsed: total_moves_parsed,
			num_moves_added:  rep_moves_after - rep_moves_before
		};
	}
};

