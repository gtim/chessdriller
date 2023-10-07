import { error } from "@sveltejs/kit";
import { PrismaClient } from '@prisma/client';

export async function GET({ locals, params }) {

	const { exportType } = params;

	// session
	const session = await locals.auth.validate();
	if (!session) return json({ success: false, message: 'not logged in' });
	const userId = session.user.cdUserId;

	const prisma = new PrismaClient();

	if ( exportType == 'moves' ) {

		const columns = [ 'id', 'moveSan', 'fromFen', 'toFen', 'repForWhite', 'ownMove', 'learningDueTime', 'learningStep', 'reviewDueDate', 'reviewInterval', 'reviewEase' ];
		const select = Object.fromEntries( columns.map( column => [ column, true ] ) );

		const moves = await prisma.Move.findMany({
			where: {
				userId,
				deleted: false,
			},
			select,
		});
		moves.forEach( (move) => {
			move.repForWhite = move.repForWhite ? 1 : 0; // compress true/false to 1/0
			move.ownMove = move.ownMove ? 1 : 0;
			move.learningDueTime = move.learningDueTime?.toISOString();
			move.reviewDueDate = move.reviewDueDate?.toISOString();
			move.reviewInterval = move.reviewInterval?.toFixed(2);
			move.reviewEase = move.reviewEase?.toFixed(2);
		} );

		return csvResponse( 'moves.csv', columns, moves );

	} else if ( exportType == 'history' ) {

		const history = await prisma.StudyHistory.findMany({
			where: {
				userId,
				move: { deleted: false },
			},
			select: {
				moveId: true,
				studiedAt: true,
				incorrectGuessSan: true,
			}
		});
		history.forEach( (entry) => {
			entry.studiedAt = entry.studiedAt.toISOString();
			entry.correct = entry.incorrectGuessSan === null ? 1 : 0;
		} );
		return csvResponse( 'history.csv', ['moveId','studiedAt','correct','incorrectGuessSan'], history );


	} else {
		throw error(404);
	}
}

function csvResponse( filename, columns, objs ) {
		// assumes column headers and cells don't include comma or newline
		const rows = objs.map( (obj) => columns.map( (col) => obj[col] ).join(',') );
		return new Response(
			columns.join(',') + '\n' + rows.join('\n') + '\n',
			{
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': `attachment; filename=${filename}`
				}
			}
		);
	
}
