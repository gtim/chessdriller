import { error } from "@sveltejs/kit";
import { PrismaClient } from '@prisma/client';

export async function GET({ locals, params }) {

	const { exportType } = params;

	// session
	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });
	const userId = user.cdUserId;

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

		// construct CSV. assumes column headers and cells don't include comma or newline.
		const moveToCsvRow = (move) => {
			return columns.map( (col) => {
				if ( col === 'repForWhite' || col === 'ownMove' ) {
					return move[col] ? 1 : 0 // compress true/false to 1/0
				} else if ( col === 'learningDueTime' || col === 'reviewDueDate' ) {
					return move[col]?.toISOString(); 
				} else if ( col === 'reviewInterval' || col === 'reviewEase' ) {
					return move[col]?.toFixed(2); // no point in returning 10 decimals
				} else {
					return move[col]
				}
			} ).join(',');
		};
		return new Response(
			columns.join(',') + '\n' + moves.map(moveToCsvRow).join('\n') + '\n',
			{
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': `attachment; filename=${exportType}.csv`
				}
			}
		);

	} else {
		throw error(404);
	}
}
