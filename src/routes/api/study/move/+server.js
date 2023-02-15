import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/*
 * learning step:
 *   0: new card, show immediately
 *   1: 1 min
 *   2: 10 min (move to review when done)
 */

export async function POST({ request }) {
	const userId = 1; // TODO
	const { move_id, correct, guess } = await request.json();

	try {

	const move = await prisma.Move.findUniqueOrThrow({
		where: { id: move_id },
		select: {
			id: true,
			userId: true,
			ownMove: true,
			learningDueTime: true,
			learningStep: true,
			reviewDueDate: true,
			reviewInterval: true,
			reviewEase: true
		}
	}); // TODO return error message

	if ( move.userId != userId )
		throw new Error( "can't practice move belonging to another user ID" ); // TODO return error message
	if ( ! move.ownMove )
		throw new Error( "can't practice opponent's move" ); // TODO return error message

	// find next step

	let update = {};
	if ( ! correct ) {
		if ( move.learningDueTime ) { // move in Learning
			update.learningDueTime = new Date();
			update.learningStep = 0;
		} else { // move in Review
			update.reviewDueDate  = date_in_n_days(1);
			update.reviewInterval = 1;
			// TODO: "relearn"-step on lapse
		}
	} else {
		if ( move.learningDueTime ) {
			// promote correct moves in Learning regardless of whether they were due or not
			if ( move.learningStep == 0 ) {
				update.learningDueTime = datetime_in_n_minutes(1);
				update.learningStep = 1;
			} else if ( move.learningStep == 1 ) {
				update.learningDueTime = datetime_in_n_minutes(10);
				update.learningStep = 2;
			} else if ( move.learningStep == 2 ) {
				// graduate
				update.learningDueTime = null;
				update.learningStep    = null;
				update.reviewInterval  = 1;
				update.reviewDueDate   = date_in_n_days( update.reviewInterval );
				update.reviewEase      = 2;
			} else {
				throw new Error( 'invalid learning step for move '+move.id+': '+move.learningStep );
			}
		} else {
			// move in review
			// TODO
			throw new Error( 'moves in review not yet implemented' );
		}
	}

	await prisma.Move.update({
		where: { id: move.id },
		data: update
	});
	await prisma.StudyHistory.create({
		data: {
			userId: userId,
			moveId: move.id,
			incorrectGuessSan: correct ? null : guess
		}
	});


	} catch ( e ) {
		console.log(e);
		return json( {
			success: false,
			error: e.message
		} );
	}

	return json( { success: true} );
}

function datetime_in_n_minutes( n ) {
	let date = new Date();
	date.setTime( date.getTime() + n*60*1000 );
	return date;
}

function date_in_n_days( n ) {
	let date = new Date();
	date.setDate( date.getDate() + n );
	date.setUTCHours(0,0,0,0);
	return date;
}

function a() {
}

