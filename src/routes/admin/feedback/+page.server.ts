import { redirect } from "@sveltejs/kit";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/");
	if ( session.user.cdUserId != 13 ) throw redirect(302, "/"); // TODO hardcoded admin user ID

	const feedbacks = await prisma.feedback.findMany({
		include: { user: true },
		orderBy: [ { submitted: 'desc' } ],
	});
	await prisma.feedback.updateMany({
		data: {
			seen: true,
		},
	});
	return { feedbacks };
};
