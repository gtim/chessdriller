import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
//import { getLineForStudy, getClosestLineForStudy } from '$lib/scheduler.js';

export async function GET({ url, locals }) {

	// session
	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	const prisma = new PrismaClient();
	const cdUser = await prisma.User.findUnique({
		where: { id: user.cdUserId }
	});

	if ( ! cdUser ) {
		return json({ success: false, message: 'cdUser not found' });
	}
	if ( ! cdUser.lichessUsername || ! cdUser.lichessAccessToken ) {
		return json({ success: false, message: 'Lichess username or access token missing, please try logging in again' });
	}

	const req = new Request( 'https://lichess.org/study/by/' + cdUser.lichessUsername + '/export.pgn', {
		method: "GET",
		headers: {
			"User-Agent": "Chessdriller.org (tim@gurka.se)",
			"Authorization": "Bearer " + cdUser.lichessAccessToken
		}
	} );
	const resp = await fetch(req);
	if ( ! resp.ok ) {
		return json({ success: false, message: 'Lichess request failed (' + resp.status + '): ' + await resp.text()} );
	}

	// TODO regex for study URLs

	const response = { user: user.cdUserId, response: await resp.text() };

	return json(response);
}


