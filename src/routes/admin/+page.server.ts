import { redirect } from "@sveltejs/kit";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/");
	if ( session.user.cdUserId != 13 ) throw redirect(302, "/"); // TODO hardcoded admin user ID

	const users = await prisma.user.findMany({
		select: {
			id: true,
			lichessUsername: true,
			lichessAccessTokenFetchedAt: true,
			_count: { 
				select: {
					studies: true,
					pgns: true,
					moves: true,
					history: true,
				}
			}
		}
	});

	const numUnseenFeedback = await prisma.feedback.count({
		where: { seen: false }
	});
	return { users, numUnseenFeedback };

};
