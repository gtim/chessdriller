import { getNextLineForStudy, moveIsDue } from '$lib/scheduler.js';
import { importPgn } from '$lib/pgnImporter.js';
import { PrismaClient } from '@prisma/client';

describe( 'moveIsDue', () => {
	test('not-own moves', () => {
		const date = new Date('2023-02-19T12:00:00');
		expect(
			moveIsDue( {
				ownMove: false, 
				learningDueTime: new Date('2023-02-18T10:00:00'),
				reviewDueDate: null
			}, date )
		).toBe(false);
		expect(
			moveIsDue( {
				ownMove: false, 
				learningDueTime: null,
				reviewDueDate: new Date('2023-02-17T00:00:00')
			}, date )
		).toBe(false);
	});
	
	test('moves in learning', () => {
		const move230218T10 = {
			ownMove: true, 
			learningDueTime: new Date('2023-02-18T10:00:00'),
			reviewDueDate: null
		};
		expect( moveIsDue( move230218T10, new Date('2022-02-18T10:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2022-02-18T23:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-17T10:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-17T23:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T00:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T09:59:59') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T10:00:01') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T23:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-19T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-19T10:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-03-19T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2024-02-19T00:00:00') ) ).toBe( true );
	} );

	test('moves in review', () => {
		const move230218 = {
			ownMove: true, 
			learningDueTime: null,
			reviewDueDate: new Date('2023-02-18T00:00:00')
		};
		expect( moveIsDue( move230218, new Date('2022-02-18T10:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2022-02-18T23:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-17T10:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-17T23:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-18T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T09:59:59') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T10:00:01') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T23:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-19T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-19T10:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-03-19T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2024-02-19T00:00:00') ) ).toBe( true );
	} );
});

describe( 'getNextLineForStudy', () => {
	test('no due moves', async () => {
		const moves = [
			{ id: 0, moveSan: 'e4', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq' },
			{ id: 1, moveSan: 'c5', ownMove: false, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
			  toFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq' },
			{ id: 2, moveSan: 'Nf3', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq' },
			{ id: 3, moveSan: 'd6', ownMove: false, repForWhite: true,
			  fromFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq',
			  toFen: 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq' },
			{ id: 4, moveSan: 'Bb5+', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq',
			  toFen: 'rnbqkbnr/pp2pppp/3p4/1Bp5/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq' }
		];
		// all moves in learning
		moves.forEach( m => m.learningDueTime = new Date('2023-01-21T12:34:56' ) );
		expect(
			await getNextLineForStudy( moves, new Date('2023-01-21T12:34:55') )
		).toMatchObject( {
			line: [],
			start_ix: 0,
			num_due_moves: 0
		} );
		// all moves in review
		moves.forEach( m => {
			m.learningDueTime = null;
			m.reviewDueDate = new Date('2023-01-22T00:00:00' )
		} );
		expect(
			await getNextLineForStudy( moves, new Date('2023-01-21T12:34:55') )
		).toMatchObject( {
			line: [],
			start_ix: 0,
			num_due_moves: 0
		} );
	} );

	test.todo( 'no moves at all' );
	test.todo( 'moves, but no own moves' );
	test.todo( 'no last_line: find the most due move (review-only and mixed)' );
	test.todo( 'no last_line: buildLineBackwards, make sure proper sane line is returned' );
	test.todo( 'no last_line: continueLineUntilEnd, make sure proper sane line is returned' );
	test.todo( 'last_line: make sure latest due deviation is returned' );
	test.todo( 'last_line: make sure latest due deviation is returned when a later non-due deviation exists' );
	test.todo( 'last_line: with no more moves in same rep, make sure most due move is returned' );
});
