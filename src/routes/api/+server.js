import { json, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET({ url }) {
	let res = await prisma.PrismaTest.create({ data: { created_at: new Date() } } );
	return json({res:res});
}
