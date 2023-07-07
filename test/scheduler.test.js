import { getLineForStudy, moveIsDue } from '$lib/scheduler.js';

describe( 'moveIsDue', () => {
	test('not-own moves', () => {
		const date = new Date('2023-02-19T12:00:00Z');
		expect(
			moveIsDue( {
				ownMove: false, 
				learningDueTime: new Date('2023-02-18T10:00:00Z'),
				reviewDueDate: null
			}, date )
		).toBe(false);
		expect(
			moveIsDue( {
				ownMove: false, 
				learningDueTime: null,
				reviewDueDate: new Date('2023-02-17')
			}, date )
		).toBe(false);
	});
	
	test('moves in learning', () => {
		const move230218T10 = {
			ownMove: true, 
			learningDueTime: new Date('2023-02-18T10:00:00Z'),
			reviewDueDate: null
		};
		expect( moveIsDue( move230218T10, new Date('2022-02-18T10:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2022-02-18T23:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-17T10:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-17T23:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T00:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T09:59:59Z') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T10:00:01Z') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T23:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-19T00:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-19T10:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-03-19T00:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2024-02-19T00:00:00Z') ) ).toBe( true );
	} );

	test('moves in review', () => {
		const move230218 = {
			ownMove: true, 
			learningDueTime: null,
			reviewDueDate: new Date('2023-02-18')
		};
		expect( moveIsDue( move230218, new Date('2022-02-18T10:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2022-02-18T23:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-17T10:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-17T23:00:00Z') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-18T00:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T09:59:59Z') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T10:00:01Z') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T23:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-19T00:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-19T10:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-03-19T00:00:00Z') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2024-02-19T00:00:00Z') ) ).toBe( true );
	} );
});

describe( 'getLineForStudy', () => {
	const empty_response = {
		line: [],
		start_ix: 0,
		num_due_moves: 0
	};
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
			await getLineForStudy( moves, new Date('2023-01-21T12:34:55') )
		).toMatchObject( empty_response );
		// all moves in review
		moves.forEach( m => {
			m.learningDueTime = null;
			m.reviewDueDate = new Date('2023-01-22' )
		} );
		expect(
			await getLineForStudy( moves, new Date('2023-01-21T12:34:55') )
		).toMatchObject( empty_response );
	} );

	test( 'with no moves at all, empty response should be returned', async () => {
		expect(
			await getLineForStudy( [], new Date('2023-01-21T12:34:56') )
		).toMatchObject( empty_response );
	} );

	test( 'with no own moves, empty response should be returned', async () => {
		const moves = [
			{ id: 0, moveSan: 'e4', ownMove: false, repForWhite: false,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
			  learningDueTime: new Date( '2023-01-21T12:34:56Z' ) },
			{ id: 1, moveSan: 'd4', ownMove: false, repForWhite: false,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq',
			  learningDueTime: new Date( '2023-01-21T12:34:56Z' ) },
		];
		expect(
			await getLineForStudy( moves, new Date('2023-01-28T00:00:00Z') )
		).toMatchObject( empty_response );
	} );

	test( 'the most due move should be returned', async () => {
		const moves = [
			{ id: 0, moveSan: 'e4', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq' },
			{ id: 1, moveSan: 'd4', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq' },
			{ id: 2, moveSan: 'c4', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq' },
			{ id: 3, moveSan: 'Nf3', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq' }
		];
		for ( let i = 0; i < moves.length; i++ ) {

			// learning only
			moves.forEach( m => {
				m.learningDueTime = new Date('2023-01-21T12:34:56' );
				m.reviewDueDate = null;
			} );
			moves[i].learningDueTime = new Date('2023-01-21T12:34:55' );
			expect(
				await getLineForStudy( moves, new Date('2023-01-21T12:34:57') )
			).toMatchObject( {
				line: [ { id: i } ],
				start_ix: 0
			} );

			// review only
			moves.forEach( m => {
				m.learningDueTime = null;
				m.reviewDueDate = new Date('2023-01-21' );
			} );
			moves[i].reviewDueDate = new Date('2023-01-20' );
			expect(
				await getLineForStudy( moves, new Date('2023-01-21T12:34:57') )
			).toMatchObject( {
				line: [ { id: i } ],
				start_ix: 0
			} );

			// mixed learning/review
			moves[i].learningDueTime = new Date('2023-01-21T12:34:56' );
			moves[i].reviewDueDate = null;
			moves[(i+1)%moves.length].learningDueTime = new Date('2023-01-21T12:34:57' );
			moves[(i+1)%moves.length].reviewDueDate = null;
			moves[(i+2)%moves.length].learningDueTime = new Date('2023-01-21T13:34:56' );
			moves[(i+2)%moves.length].reviewDueDate = null;
			moves[(i+3)%moves.length].learningDueTime = null;
			moves[(i+3)%moves.length].reviewDueDate = new Date('2023-01-20');
			expect(
				await getLineForStudy( moves, new Date('2023-01-21T12:34:58') )
			).toMatchObject( {
				line: [ { id: i } ],
				start_ix: 0
			} );
		}
	});
	test( 'return the most due move, even if due review and undue learning at current date', async () => {
		const moves = [
			{ id: 3, moveSan: 'e4', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
			  reviewDueDate: new Date('2023-01-21')
			},
			{ id: 4, moveSan: 'd4', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq',
			  learningDueTime: new Date('2023-01-21T20:00:00Z')
			}
		];
		expect(
			await getLineForStudy( moves, new Date('2023-01-21T12:00:00Z') )
		).toMatchObject( {
			line: [ { id: 3 } ],
			start_ix: 0
		} );
		expect(
			await getLineForStudy( moves, new Date('2023-01-21T22:00:00Z') )
		).toMatchObject( {
			line: [ { id: 4 } ],
			start_ix: 0
		} );
	} );
	test.todo( 'getLineForStudy: buildLineBackwards, make sure proper sane line is returned' );
	test.todo( 'getLineForStudy: continueLineUntilEnd, make sure proper sane line is returned' );
	test.todo( 'getClosestLineForStudy: make sure latest due deviation is returned' );
	test.todo( 'getClosestLineForStudy: make sure latest due deviation is returned when a later non-due deviation exists' );
	test.todo( 'getClosestLineForStudy: with no more moves in same rep, make sure most due move is returned' );

	test( 'same FEN should not be repeated (cyclic move graph)', async () => {
		const moves = [
			{ id: 0, moveSan: 'e4', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq' },
			{ id: 1, moveSan: 'e5', ownMove: false, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
			  toFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq' },
			{ id: 2, moveSan: 'Bc4', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq' },
			{ id: 3, moveSan: 'Bc5', ownMove: false, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq',
			  toFen: 'rnbqk1nr/pppp1ppp/8/2b1p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq' },
			{ id: 4, moveSan: 'Bf1', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqk1nr/pppp1ppp/8/2b1p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq',
			  toFen: 'rnbqk1nr/pppp1ppp/8/2b1p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq' },
			{ id: 5, moveSan: 'Bf8', ownMove: false, repForWhite: true,
			  fromFen: 'rnbqk1nr/pppp1ppp/8/2b1p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
			  toFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq' },
			{ id: 6, moveSan: 'Nf3', ownMove: true, repForWhite: true,
			  fromFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq',
			  toFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq' }
		];
		moves.forEach( m => m.reviewDueDate  = new Date('2023-01-21' ) );
		moves.find(m=>m.id==6).reviewDueDate = new Date('2023-01-20' );
		// Run multiple times since moves are picked randomly at junctions
		for ( let i = 0; i < 100; i++ ) {
			expect(
				await getLineForStudy( moves, new Date('2023-01-21T22:00:00Z') )
			).toMatchObject( {
				line: [
					expect.objectContaining({id:0}),
					expect.objectContaining({id:1}),
					expect.objectContaining({id:6})
				]
			} );
		}
		moves.find(m=>m.id==4).reviewDueDate = new Date('2023-01-19' );
		for ( let i = 0; i < 100; i++ ) {
			expect(
				await getLineForStudy( moves, new Date('2023-01-21T22:00:00Z') )
			).toMatchObject( {
				line: [
					expect.objectContaining({id:0}),
					expect.objectContaining({id:1}),
					expect.objectContaining({id:2}),
					expect.objectContaining({id:3}),
					expect.objectContaining({id:4}),
					expect.objectContaining({id:5})
				]
			} );
		}
	} );
	test.todo( 'getClosestLineForStudy: same FEN should not be repeated (cyclic move graph)' );
});
