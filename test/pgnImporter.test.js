import { PrismaClient } from '@prisma/client';
import { importPgn } from '$lib/pgnImporter.js';
import fs from 'fs';

let prisma;

beforeAll( async () => {
	require('dotenv').config({ path: '.env.test', override: true });
	prisma = new PrismaClient( {
		datasources: {
			db: { url: process.env.DATABASE_URL }
		}
	} );
	await prisma.user.create({data:{}});
} );

test("prisma client is defined", () => {
	expect(prisma).toBeDefined();
});

test('simple pgn', async () => {
	const pgn_content = fs.readFileSync( './test/pgn/1.pgn', 'utf8' );
	await importPgn( pgn_content, '1.pgn', prisma, 1, true );
	expect( await prisma.move.count() ).toEqual( 4 );
	expect(
		await prisma.move.findFirst({ where: { moveSan: 'e4' } })
	).toMatchObject( {
		moveSan: 'e4',
		fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
		toFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
		repForWhite: true,
		ownMove: true
	} );
	expect(
		await prisma.move.findFirst({ where: { moveSan: 'c5' } })
	).toMatchObject( {
		moveSan: 'c5',
		fromFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
		toFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq',
		repForWhite: true,
		ownMove: false
	} );
	expect(
		await prisma.move.findFirst({ where: { moveSan: 'Nf3' } })
	).toMatchObject( {
		moveSan: 'Nf3',
		fromFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq',
		toFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq',
		repForWhite: true,
		ownMove: true
	} );
	expect(
		await prisma.move.findFirst({ where: { moveSan: 'd6' } })
	).toMatchObject( {
		moveSan: 'd6',
		fromFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq',
		toFen: 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq',
		repForWhite: true,
		ownMove: false
	} );
	expect( await prisma.move.count({ where: { moveSan: 'e5' } }) ).toEqual( 0 );
});
