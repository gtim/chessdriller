import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { deletePgn } from '$lib/pgnImporter.js';
const prisma = new PrismaClient();

export async function POST({ url, locals, params }) {
	const { user } = await locals.auth.validateUser();
	if (!user) return json({ success: false, message: 'not logged in' });

	try {
		const num_deleted_moves = await deletePgn( +params.pgnId, user.cdUserId, prisma );
		return json({ success: true, num_deleted_moves });
	} catch (e) {
		return json({ success: false, message: 'PGN deletion failed: ' + e.message });
	}

}
