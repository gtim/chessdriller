import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

export async function POST({ locals, params }) {
	const session = await locals.auth.validate();
	if (!session) return json({ success: false, message: 'not logged in' });

	let new_value;
	if ( params.column === 'hidden' ) {
		// boolean
		if ( params.newValue === 'true' ) {
			new_value = true;
		} else if ( params.newValue === 'false' ) {
			new_value = false;
		} else {
			return json({ success: false, message: 'invalid value for ' + params.column + ': ' + params.newValue });
		}
	} else {
		return json({ success: false, message: 'invalid column: ' + params.column });
	}

	const prisma = new PrismaClient();
	try {
		await prisma.LichessStudy.updateMany({
			where: {
				userId: session.user.cdUserId,
				id: +params.studyId
			},
			data: {
				[params.column]: new_value
			}
		});
		return json({ success: true });
	} catch(e) {
		return json({
			success: false,
			message: e.message
		});
	}
}
