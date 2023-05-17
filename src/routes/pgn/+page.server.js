import { redirect } from "@sveltejs/kit";
import { PrismaClient } from '@prisma/client';
import { importPgn } from '$lib/pgnImporter.js';
const prisma = new PrismaClient();

// data loader for PGN table

export const load = async ({locals}) => {
	// session
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/join"); // force login

	// get PGNs
	const pgns = await prisma.Pgn.findMany({
		where: { userId: user.cdUserId },
		select: {
			id: true,
			repForWhite: true,
			filename: true,
			uploaded: true,
			content: true,
			_count: 'moves'
		},
		orderBy: { uploaded: 'desc' }
	});
	return {pgns};

}

// form action for uploading PGN

export const actions = {
	default: async ({cookies,request,locals}) => {

		// session
		const { user } = await locals.auth.validateUser();
		if (!user) return json({ success: false, message: 'not logged in' });
		const userId = user.cdUserId;

		const formData = await request.formData();

		if ( ! formData.get('pgn') )
			return { success: false, message: 'No PGN file submitted' };
		const file = formData.get('pgn');
		if ( ! file.size )
			return { success: false, message: 'No PGN file selected' };

		if ( ! formData.get('color') )
			return { success: false, message: 'No color picked' };
		const repForWhite = formData.get('color') == 'w';


		// TODO: check file max size

		const rep_moves_before = await prisma.move.count({
			where: { userId, repForWhite: repForWhite, deleted: false } 
		});

		let total_moves_parsed;

		try {
			const pgn_text = await file.text();
			total_moves_parsed = await importPgn( pgn_text, file.name, prisma, userId, repForWhite );
		} catch ( e ) {
			return {
				success: false,
				message: e.message
			};
		}

		const rep_moves_after = await prisma.move.count({
			where: { userId, repForWhite: repForWhite, deleted: false }
		});

		return {
			success: true,
			num_moves_parsed: total_moves_parsed,
			num_moves_added:  rep_moves_after - rep_moves_before
		};
	}
};

