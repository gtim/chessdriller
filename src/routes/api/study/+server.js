/*
 * input:
 * 	optional: last
 * 		last line studied. array of move IDs.
 *
 * return:
 * 	if first call (no "last"):
 * 		a line with the "most due" move
 * 	else (TODO):
 * 	return a line that:
 * 		deviates the latest from the one just studied (check last move for deviations, then second last move, etc)
 * 		and contains the most due moves
 * 			(issue: prioritizes long lines)
 *
 * 	also: pointer to move to start at
 *
 * 	          
 * TODO: handle multiple ownMoves
 *
 * future:
 * 	return a bunch of lines to study, maybe covering the entire due repertoire
 *
 * note: some algorithms here are DoS-vulnerable to malign/pathological PGNs.
 *
 */

import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { getNextLineForStudy } from '$lib/scheduler.js';

export async function GET({ url }) {
	const user_id = 1; // TODO
	const prisma = new PrismaClient();

	const last_line = url.searchParams.has('last') ? JSON.parse( url.searchParams.get('last') ) : [];

	const response = await getNextLineForStudy( prisma, user_id, last_line );

	return json(response);
}

