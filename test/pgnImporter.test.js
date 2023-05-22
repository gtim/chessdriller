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

beforeEach( async () => {
	await prisma.move.deleteMany({});
} );

test("prisma client is defined", () => {
	expect(prisma).toBeDefined();
});

test('simple pgn', async () => {
	const pgn_content = fs.readFileSync( './test/pgn/simple.pgn', 'utf8' );
	await importPgn( pgn_content, 'simple.pgn', prisma, 1, true );
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

test('simple pgn, black', async () => {
	const pgn_content = fs.readFileSync( './test/pgn/simple.pgn', 'utf8' );
	await importPgn( pgn_content, 'simple.pgn', prisma, 1, false );
	expect( await prisma.move.count() ).toEqual( 4 );
	expect(
		await prisma.move.findFirst({ where: { moveSan: 'e4' } })
	).toMatchObject( {
		ownMove: false,
		repForWhite: false
	} );
	expect(
		await prisma.move.findFirst({ where: { moveSan: 'c5' } })
	).toMatchObject( {
		ownMove: true,
		repForWhite: false
	} );
	expect(
		await prisma.move.findFirst({ where: { moveSan: 'Nf3' } })
	).toMatchObject( {
		ownMove: false,
		repForWhite: false
	} );
	expect(
		await prisma.move.findFirst({ where: { moveSan: 'd6' } })
	).toMatchObject( {
		ownMove: true,
		repForWhite: false
	} );
});

test('recursive annotation variation', async () => {
	const pgn_content = fs.readFileSync( './test/pgn/rav.pgn', 'utf8' );
	await importPgn( pgn_content, 'rav.pgn', prisma, 1, true );
	expect( await prisma.move.count() ).toEqual( 11 );
	expect( await prisma.move.count({ where: { moveSan: 'd5' } } )).toEqual( 2 );
	expect( await prisma.move.count({ 
		where: { fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq' }
	} )).toEqual( 1 );
	expect( await prisma.move.count({ 
		where: { fromFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq' }
	} )).toEqual( 2 );
	expect( await prisma.move.count({ 
		where: { fromFen: 'rnbqkb1r/pppppppp/5n2/6B1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq' }
	} )).toEqual( 3 );
});

test('pgn database', async () => {
	const pgn_content = fs.readFileSync( './test/pgn/database.pgn', 'utf8' );
	await importPgn( pgn_content, 'database.pgn', prisma, 1, true );
	expect( await prisma.move.count() ).toEqual( 13 );
	expect( await prisma.move.count({ where: { moveSan: 'd4' } } )).toEqual( 1 );
	expect( await prisma.move.count({ where: { moveSan: 'd5' } } )).toEqual( 1 );
	expect( await prisma.move.count({ where: { moveSan: 'c4' } } )).toEqual( 2 );
	expect( await prisma.move.count({ where: { moveSan: 'Nf3' } } )).toEqual( 2 );
	expect( await prisma.move.count({ 
		where: { fromFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq' }
	} )).toEqual( 3 );
});

test('transposition', async () => {
	const pgn_content = fs.readFileSync( './test/pgn/transposition.pgn', 'utf8' );
	await importPgn( pgn_content, 'transposition.pgn', prisma, 1, true );
	expect( await prisma.move.count() ).toEqual( 11 );
	expect( await prisma.move.count({ where: { moveSan: 'd4' } } )).toEqual( 2 );
	expect( await prisma.move.count({ where: { moveSan: 'd5' } } )).toEqual( 2 );
	expect( await prisma.move.count({ where: { moveSan: 'Nf3' } } )).toEqual( 1 );
	expect( await prisma.move.count({ 
		where: { toFen: 'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq' }
	} )).toEqual( 2 );
	expect( await prisma.move.count({ 
		where: { fromFen: 'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq' }
	} )).toEqual( 1 );
	expect( await prisma.move.count({ 
		where: { toFen: 'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/5N2/PP2PPPP/RNBQKB1R b KQkq' }
	} )).toEqual( 1 );
});


// cm-pgn 2.3.1 seems to fail parsing these two PGN
test('two comments after final move', async () => {
	const pgn_content = fs.readFileSync( './test/pgn/end-two-comments.pgn', 'utf8' );
	await importPgn( pgn_content, 'end-two-comments.pgn', prisma, 1, true );
	expect( await prisma.move.count() ).toEqual( 2 );
	expect( await prisma.move.count({ where: { moveSan: 'd4' } } )).toEqual( 1 );
	expect( await prisma.move.count({ where: { moveSan: 'Nf6' } } )).toEqual( 1 );
});
test('two comments before variant', async () => {
	const pgn_content = fs.readFileSync( './test/pgn/two-comments-before-variant.pgn', 'utf8' );
	await importPgn( pgn_content, 'two-comments-before-variant.pgn', prisma, 1, true );
	expect( await prisma.move.count() ).toEqual( 4 );
	expect( await prisma.move.count({ where: { moveSan: 'd4' } } )).toEqual( 1 );
	expect( await prisma.move.count({ where: { moveSan: 'Nf6' } } )).toEqual( 1 );
	expect( await prisma.move.count({ where: { moveSan: 'Bf4' } } )).toEqual( 1 );
	expect( await prisma.move.count({ where: { moveSan: 'Bg5' } } )).toEqual( 1 );
});
