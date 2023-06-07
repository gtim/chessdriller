import { redirect } from "@sveltejs/kit";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/");
	if ( user.cdUserId != 13 ) throw redirect(302, "/"); // TODO hardcoded admin user ID

	const users = await prisma.User.findMany({
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
	return { users };

};
