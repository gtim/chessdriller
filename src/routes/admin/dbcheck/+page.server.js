import { redirect } from "@sveltejs/kit";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/");
	if ( user.cdUserId != 13 ) throw redirect(302, "/"); // TODO hardcoded admin user ID

	let checks = [];

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
	checks.push( {
		title: 'Unincluded studies with moves',
		items: unincludedStudiesWithMoves.map( (s) => `${s.name} (#${s.id}) by ${s.user.lichessUsername}: ${s.moves.length} moves` )
	} );

	// Find orphan moves that are not deleted
	
	const orphans = await prisma.Move.findMany({
		where: {
			AND: [
				{ pgns:    { none: {} } },
				{ studies: { none: {} } },
				{ deleted: false }
			]
		},
		select: {
			id: true,
			user: { select: {
				lichessUsername: true
			} }
		}
	});
	checks.push( {
		title: 'Orphan moves that are not deleted',
		items: orphans.map( (m) => `Move #${m.id} (${m.user.lichessUsername})` )
	} );

	return { checks };

};
