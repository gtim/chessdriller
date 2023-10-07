import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

export async function POST({ locals, request }) {

	const session = await locals.auth.validate();
	const userId = session ? session.user.cdUserId : null;

	const { content, email } = await request.json();

	const prisma = new PrismaClient();
	await prisma.feedback.create({
		data: {
			ip: '', // why is clientAddress undefined here?
			userId,
			content,
			email,
		}
	});

	return json( { success: true } );
}
