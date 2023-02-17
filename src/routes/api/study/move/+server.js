import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/*
 * learning step:
 *   0: new card, show immediately
 *   1: 1 min
 *   2: 10 min
 *   3: 8h
 *   4: 16h (move to review when done)
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

	const now = new Date(); 
	let update = {};
	if ( ! correct ) {
		// Incorrect: reset card, regardless of Learning/Review state.
		update.learningDueTime = new Date();
		update.learningStep = 0;
		update.reviewDueDate  = null;
		update.reviewInterval = null;
		update.reviewEase     = move.reviewEase ? Math.min( 1.3, move.reviewEase - 0.2 ) : null;
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
				update.learningDueTime = datetime_in_n_minutes(8*60);
				update.learningStep = 3;
			} else if ( move.learningStep == 3 ) {
				update.learningDueTime = datetime_in_n_minutes(16*60);
				update.learningStep = 4;
			} else if ( move.learningStep == 4 ) {
				// graduate
				update.learningDueTime = null;
				update.learningStep    = null;
				update.reviewInterval  = 1;
				update.reviewDueDate   = date_in_n_days( update.reviewInterval );
				update.reviewEase      = move.reviewEase || 2.5;
			} else {
				throw new Error( 'invalid learning step for move '+move.id+': '+move.learningStep );
			}
		} else {
			// move in review
			if ( isDue( move, now ) ) {
				update.reviewInterval = move.reviewInterval * move.reviewEase;
				update.reviewDueDate  = date_in_n_days( Math.ceil( update.reviewInterval ) );
			} else {
				// not due: don't increase interval
				update.reviewDueDate  = date_in_n_days( Math.ceil( move.reviewInterval ) );
			}
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

function isDue(move,now) {
	// TODO duplicated in api/{study,api}/+server.js, abstract it properly
	if ( ! move.ownMove ) {
		return false;
	} else if ( move.learningDueTime ) {
		return move.learningDueTime <= now;
	} else if ( move.reviewDueDate ) {
		return move.reviewDueDate <= now; 
	} else {
		throw new Error( 'isDue invalid own/learning/review state for move #'+move.id );
	}
}
