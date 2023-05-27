import { redirect } from "@sveltejs/kit";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/");
	if ( user.cdUserId != 13 ) throw redirect(302, "/"); // TODO hardcoded admin user ID

	// Find unincluded studies with moves
	
	const unincludedStudiesWithMoves = await prisma.LichessStudy.findMany({
		where: {
			included: false,
			moves: { some: {} }
		},
		select: {
			id: true,
			name: true,
			moves: true,
			user: { select: {
				id: true,
				lichessUsername: true
			} }
		}
	});
	return {
		unincludedStudiesWithMoves
	};

};
