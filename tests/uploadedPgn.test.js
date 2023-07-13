import { PrismaClient } from '@prisma/client';
import { importPgn } from '$lib/uploadedPgn.js';
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
	await prisma.pgn.deleteMany({});
	await prisma.move.deleteMany({});
} );

test("prisma client is defined", () => {
	expect(prisma).toBeDefined();
});


describe( 'importPgn', () => {

	test('simple pgn', async () => {
		const pgn_content = fs.readFileSync( './tests/pgn/simple.pgn', 'utf8' );
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
		const pgn_content = fs.readFileSync( './tests/pgn/simple.pgn', 'utf8' );
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
		const pgn_content = fs.readFileSync( './tests/pgn/rav.pgn', 'utf8' );
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
		const pgn_content = fs.readFileSync( './tests/pgn/database.pgn', 'utf8' );
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
		const pgn_content = fs.readFileSync( './tests/pgn/transposition.pgn', 'utf8' );
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

	test('not a PGN file', async () => {
		const pgn_content = fs.readFileSync( './tests/pgn/not-a-pgn.txt', 'utf8' );
		await expect( importPgn( pgn_content, 'not-a-pgn.txt', prisma, 1, true ) ).rejects.toThrowError();
		expect( await prisma.pgn.count() ).toEqual( 0 );
		expect( await prisma.move.count() ).toEqual( 0 );
	} );

	test('64-chapter PGN', async () => {
		const pgn_content = fs.readFileSync( './tests/pgn/64-chapters.pgn', 'utf8' );
		await importPgn( pgn_content, '64-chapters.pgn', prisma, 1, false );
		expect( await prisma.pgn.count() ).toEqual( 1 );
		expect( await prisma.move.count({ where: { ownMove: true } } ) ).toEqual( 68 );
		expect( await prisma.move.count({ where: { moveSan: 'a6' } } ) ).toEqual( 20 );
		expect( await prisma.move.count({ where: { moveSan: 'a5' } } ) ).toEqual( 48 );
	} );

} );

describe( 'deletePgn', () => {
	test.todo('delete PGN, check wrong user ID throws error');
	test.todo('delete PGN, check invalid PGN ID throws error');
	test.todo('add and delete PGN, check PGN row removed');
	test.todo('add and delete PGN, check moves soft-deleted');
	test.todo('add and delete PGN, check moves not soft-deleted');
} );
