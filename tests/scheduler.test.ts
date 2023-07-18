import { getLineForStudy, moveIsDue } from '$lib/scheduler.js';
import { Chess } from 'chess.js'; // for createRepertoire helper
import type { Move } from '@prisma/client';
import type { StudyLineResponse, MoveWithPossibleBranches } from '$lib/scheduler.js';

/*
 * Test study-line fetching logic
 */

const emptyStudyLineResponse: StudyLineResponse = {
	line: [],
	start_ix: 0,
	due_ix: [],
	num_due_moves: 0
};

// helper functions to turn array of SAN lines into a repertoire / Move-array for getLineForStudy
function createRepertoire( sanLines: string[][], repForWhite = true ) {
	let repertoire: Move[] = [];
	const chess = new Chess();
	for ( const sanLine of sanLines ) {
		chess.reset();
		for ( const san of sanLine ) {
			const cjsMove = chess.move( san );
			const move = {
				id: repertoire.length,
				moveSan: cjsMove.san,
				ownMove: ( cjsMove.color === 'w' && repForWhite || cjsMove.color === 'b' && ! repForWhite ),
				repForWhite,
				fromFen: cjsMove.before.split(' ').slice(0,3).join(' '),
				toFen:    cjsMove.after.split(' ').slice(0,3).join(' '),
				learningDueTime: new Date('2023-01-01T00:00:01Z'),
				userId: 0,
				learningStep: 1,
				reviewDueDate: null,
				reviewInterval: null,
				reviewEase: null,
				deleted: false,
			};
			if ( ! repertoire.some( (m) => m.moveSan === move.moveSan && m.ownMove === move.ownMove && m.fromFen === move.fromFen && m.toFen === move.toFen ) ) {
				repertoire.push( move );
			}
		}
	}
	return repertoire;
}
function setAllDueTime( rep: Move[], dueTime: Date ) {
	rep.forEach( m => m.learningDueTime = dueTime );
}
function setSanDueTime( rep: Move[], san: string, dueTime: Date ) {
	const moves = rep.filter( m => m.moveSan === san );
	if ( moves.length == 0 ) {
		throw new Error( 'no moves with san ' + san );
	}
	moves.forEach( m => m.learningDueTime = dueTime );
}

describe('getLineForStudy without lastLine', async () => {
	test( 'due move is returned for White move 1', async () => {
		let rep = createRepertoire( [ ['e4'],['d4'] ] );
		setSanDueTime( rep, 'e4', new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'd4', new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(1);
			expect( line[0].moveSan ).toEqual('d4');
			expect( start_ix ).toEqual(0);
		}
	} );
	test( 'due move is returned for White move 2', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3'],['e4','e5','f4'] ] );
		setAllDueTime( rep, new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'f4', new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(3);
			expect( line[2].moveSan ).toEqual('f4');
			expect( start_ix ).toEqual(0);
		}
	} );
	test( 'due move is returned for Black', async () => {
		let rep = createRepertoire( [ ['e4','e6'],['d4','Nf6'] ], false );
		setSanDueTime( rep, 'e6', new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'Nf6', new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(2);
			expect( line[1].moveSan ).toEqual('Nf6');
			expect( start_ix ).toEqual(0);
		}
	} );
	test( 'undue moves are included at end of line', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3'] ] );
		setSanDueTime( rep, 'e4', new Date( '2023-01-21T12:34:56Z' ) );
		setSanDueTime( rep, 'Nf3', new Date( '2023-01-31T12:34:56Z' ) );
		const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( line ).toHaveLength(3);
	} );
	test( 'returned branch is picked randomly', async () => {
		let rep = createRepertoire( [
			['g3','e5','Bg2','Nc6','Nf3','d5','d3'],
			['g3','e5','Nf3','Nc6','Bg2','d5','d3']
		] );
		setAllDueTime( rep, new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'd3', new Date( '2023-01-21T12:34:56Z' ) );
		let results = [];
		for ( let i = 0; i < 1000; i++ ) {
			const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(7);
			expect( line[2] ).toHaveProperty('branches');
			results.push( line[2].moveSan );
		}
		expect( results.filter( (r) => r === 'Bg2' ).length ).toBeGreaterThan(0);
		expect( results.filter( (r) => r === 'Nf3' ).length ).toBeGreaterThan(0);
		expect( results.filter( (r) => r !== 'Nf3' && r !== 'Bg2' ) ).toHaveLength(0);
	} );
	test( 'due branch is returned', async () => {
		let rep = createRepertoire( [
			['g3','e5','Bg2','Nc6','Nf3','d5','d3'],
			['g3','e5','Nf3','Nc6','Bg2','d5','d3']
		] );
		setAllDueTime( rep, new Date( '2023-01-31T12:34:56Z' ) );
		rep[2].learningDueTime = new Date( '2023-01-21T12:34:56Z' ); // Bg2 in the first branch
		setSanDueTime( rep, 'd3', new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(7);
			expect( line[2].moveSan ).toEqual('Bg2');
			expect( line[2].branches ).toBeTruthy();
			if ( line[2].branches ) { // otherwise TS will complain that branches could be undefined
				expect( line[2].branches[0].moveSan ).toEqual('Nf3');
			}
		}
	} );
	test( 'first-move branch is returned for White', async () => {
		let rep = createRepertoire( [ ['Nf3'],['g3'] ] );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line[0].branches ).toBeTruthy();
			if ( line[0].branches ) {
				expect( ['Nf3','g3'] ).toContain( line[0].branches[0].moveSan );
			}
		}
	} );
	test( 'first-move branch is returned for Black', async () => {
		let rep = createRepertoire( [ ['e4','g6'],['e4','d6'] ], false );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line[1].branches ).toBeTruthy();
			if ( line[1].branches ) {
				expect( ['g6','d6'] ).toContain( line[1].branches[0].moveSan );
			}
		}
	} );

	test( 'with no moves at all, empty response should be returned', async () => {
		expect(
			await getLineForStudy( [], new Date('2023-01-21T12:34:56') )
		).toMatchObject( emptyStudyLineResponse );
	} );
	test( 'with no own moves, empty response should be returned', async () => {
		const rep = createRepertoire( [['e4'],['d4']], false );
		expect(
			await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') )
		).toMatchObject( emptyStudyLineResponse );
	} );
	test('no due moves', async () => {
		const rep = createRepertoire( [['e4','c5','Nf3','d6','Bb5+']] );
		// all moves in learning
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		expect(
			await getLineForStudy( rep, new Date('2023-01-21T12:34:55') )
		).toMatchObject( emptyStudyLineResponse );
		// all moves in review
		rep.forEach( m => {
			m.learningDueTime = null;
			m.reviewDueDate = new Date('2023-01-22' )
		} );
		expect(
			await getLineForStudy( rep, new Date('2023-01-21T12:34:55') )
		).toMatchObject( emptyStudyLineResponse );
	} );
});

describe( 'getLineForStudy with lastLine', async () => {
	test( 'start_ix returned for White', async () => {
		let rep = createRepertoire( [
			['e4','c5','Nf3','d6','d4'],
			['e4','c5','Nf3','Nc6','Bb5']
		] );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		setSanDueTime( rep, 'e4',  new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'Nf3',  new Date( '2023-01-31T12:34:56Z' ) );
		const { start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
		expect( start_ix ).toEqual(4);
	} );
	test( 'start_ix returned for Black', async () => {
		let rep = createRepertoire( [
			['e4','c5','Nf3','d6'],
			['e4','c5','Nc3','Nc6']
		], false );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		setSanDueTime( rep, 'c5',  new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'd6',  new Date( '2023-01-31T12:34:56Z' ) );
		const { start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3] );
		expect( start_ix ).toEqual(3);
	} );
	test( 'returned move was not in last line', async () => {
		let rep = createRepertoire( [ ['e4'],['d4'] ] );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [1] );
			expect( line ).toHaveLength(1);
			expect( line[0].id ).toEqual(0);
			expect( start_ix ).toEqual(0);
		}
	} );
	test( 'return random first move, but not the one from last line', async () => {
		let rep = createRepertoire( [ ['e4'],['d4'],['c4'] ] );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		let responses = [0,0,0];
		for ( let i = 0; i < 1000; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [1] );
			expect( line ).toHaveLength(1);
			expect( start_ix ).toEqual(0);
			responses[ line[0].id ]++;
		}
		expect( responses[0] ).toBeGreaterThan(0);
		expect( responses[1] ).toEqual(0);
		expect( responses[2] ).toBeGreaterThan(0);
	} );
	test( 'backtrack from lastLine', async () => {
		let rep = createRepertoire( [ ['e4','c5','Nf3','d6','d4'],['e4','c6','d4'] ] );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		setSanDueTime( rep, 'e4',  new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'Nf3', new Date( '2023-01-31T12:34:56Z' ) );
		const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
		expect( line.map(m=>m.moveSan) ).toEqual( ['e4','c6','d4'] );
		expect( start_ix ).toEqual(2);
	} );
	test( 'backtrack from lastLine to another White first-move', async () => {
		let rep = createRepertoire( [ ['e4','c5','Nf3','d6','d4'],['d4','d5','c4'] ] );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
		expect( line.map(m=>m.moveSan) ).toEqual( ['d4','d5','c4'] );
		expect( start_ix ).toEqual(0);
	} );
	test( 'returns line close to lastLine', async () => {
		let rep = createRepertoire( [ ['e4','c5','Nf3','d6','d4'],['e4','c5','Nf3','Nc6','Bb5'],['e4','c6','Nc3'] ] );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		setSanDueTime( rep, 'e4',  new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'Nf3', new Date( '2023-01-31T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
			expect( line.map(m=>m.moveSan) ).toEqual( ['e4','c5','Nf3','Nc6','Bb5'] );
			expect( start_ix ).toEqual(4);
		}
	} );
	test( 'does not return line close to lastLine if not due', async () => {
		let rep = createRepertoire( [ ['e4','c5','Nf3','d6','d4'],['e4','c5','Nf3','Nc6','Bb5'],['e4','c6','Nc3'] ] );
		setAllDueTime( rep, new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'Nc3', new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
			expect( line.map(m=>m.moveSan) ).toEqual( ['e4','c6','Nc3'] );
			expect( start_ix ).toEqual(2);
		}
	} );
});

describe( 'getLineForStudy cycle handling', async () => {
	test( 'cycle of undue moves is avoided', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3','Nc6','Ng1','Nb8'] ] );
		setAllDueTime( rep, new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'e4', new Date( '2023-01-21T12:34:56Z' ) );
		const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( line ).toHaveLength(6);
	} );
	test( 'cycle of due moves is avoided', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3','Nc6','Ng1','Nb8'] ] );
		setAllDueTime( rep, new Date( '2023-01-21T12:34:56Z' ) );
		const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( line ).toHaveLength(6);
	} );
});

describe( 'due_ix', async () => {
	test( 'due_ix for white', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3'] ] );
		setAllDueTime( rep, new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'Nf3', new Date( '2023-01-21T12:34:56Z' ) );
		let res = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( res.due_ix ).toEqual( [2] );

		setSanDueTime( rep, 'e4', new Date( '2023-01-21T12:34:56Z' ) );
		res = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( res.due_ix ).toEqual( [0,2] );
	} );
	test( 'due_ix for black', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3','Nc6'] ], false );
		setAllDueTime( rep, new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'e5', new Date( '2023-01-21T12:34:56Z' ) );
		let res = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( res.due_ix ).toEqual( [1] );

		setSanDueTime( rep, 'Nc6', new Date( '2023-01-21T12:34:56Z' ) );
		res = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( res.due_ix ).toEqual( [1,3] );
	} );
	test( 'last move of line included in due_ix', async () => {
		let rep = createRepertoire( [
			['e4','c5','Nf3','d6','d4'],
			['e4','c5','Nf3','d6','d3'],
		] );
		setAllDueTime( rep, new Date( '2023-01-31T12:34:56Z' ) );
		setSanDueTime( rep, 'd3', new Date( '2023-01-21T12:34:56Z' ) );
		const { line, start_ix, due_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
		expect( line.map(m=>m.moveSan) ).toEqual( ['e4','c5','Nf3','d6','d3'] );
		expect( start_ix ).toEqual(4);
		expect( due_ix ).toEqual([4]); // only d3
	} );
} );


/*
 * Test moveIsDue logic
 */

describe( 'moveIsDue', () => {
	const empty_move = {
		id: 0,
		userId: 0,
		moveSan: '',
		ownMove: 'w',
		repForWhite: true,
		fromFen: '',
		toFen: '',
		learningStep: 0,
		reviewInterval: null,
		reviewEase: null,
		deleted: false,
		learningDueTime: new Date('2023-01-01T00:00:01Z'),
	};
	test('not-own moves', () => {
		const date = new Date('2023-02-19T12:00:00Z');
		expect(
			moveIsDue( {
				...empty_move,
				ownMove: false, 
				learningDueTime: new Date('2023-02-18T10:00:00Z'),
				reviewDueDate: null
			}, date )
		).toBe(false);
		expect(
			moveIsDue( {
				...empty_move,
				ownMove: false, 
				learningDueTime: null,
				reviewDueDate: new Date('2023-02-17')
			}, date )
		).toBe(false);
	});
	
	test('moves in learning', () => {
		const move230218T10 = {
			...empty_move,
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
		const move230218: Move = {
			...empty_move,
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
