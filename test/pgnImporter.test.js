import { PrismaClient } from '@prisma/client';
//import { importPgn } from '$lib/pgnImporter.js';

let prisma;

beforeAll( () => {
	require('dotenv').config();
	prisma = new PrismaClient( {
		datasources: {
			db: { url: process.env.DATABASE_URL }
		}
	} );
	prisma.User.create().then();
} );

test("prisma client is defined", () => {
	expect(prisma).toBeDefined();
});
