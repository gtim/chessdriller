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

// helper function to turn array of SAN lines into a repertoire / Move-array for getLineForStudy
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
			};
			if ( ! repertoire.some( (m) => m.moveSan === move.moveSan && m.ownMove === move.ownMove && m.fromFen === move.fromFen && m.toFen === move.toFen ) ) {
				repertoire.push( move );
			}
		}
	}
	return repertoire;
}

describe('getLineForStudy without lastLine', async () => {
	test( 'due move is returned for White move 1', async () => {
		let rep = createRepertoire( [ ['e4'],['d4'] ] );
		rep.find(m=>m.moveSan==='e4').learningDueTime = new Date( '2023-01-31T12:34:56Z' );
		rep.find(m=>m.moveSan==='d4').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(1);
			expect( line[0].moveSan ).toEqual('d4');
			expect( start_ix ).toEqual(0);
		}
	} );
	test( 'due move is returned for White move 2', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3'],['e4','e5','f4'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-31T12:34:56Z' ) );
		rep.find(m=>m.moveSan==='f4').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(3);
			expect( line[2].moveSan ).toEqual('f4');
			expect( start_ix ).toEqual(0);
		}
	} );
	test( 'due move is returned for Black', async () => {
		let rep = createRepertoire( [ ['e4','e6'],['d4','Nf6'] ], false );
		rep.find(m=>m.moveSan==='e6' ).learningDueTime = new Date( '2023-01-31T12:34:56Z' );
		rep.find(m=>m.moveSan==='Nf6').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(2);
			expect( line[1].moveSan ).toEqual('Nf6');
			expect( start_ix ).toEqual(0);
		}
	} );
	test( 'undue moves are included at end of line', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3'] ] );
		rep.find(m=>m.moveSan==='e4').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		rep.find(m=>m.moveSan==='Nf3').learningDueTime = new Date( '2023-01-31T12:34:56Z' );
		const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( line ).toHaveLength(3);
	} );
	test( 'returned branch is picked randomly', async () => {
		let rep = createRepertoire( [
			['g3','e5','Bg2','Nc6','Nf3','d5','d3'],
			['g3','e5','Nf3','Nc6','Bg2','d5','d3']
		] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-31T12:34:56Z' ) );
		rep.find( m => m.moveSan === 'd3' ).learningDueTime = new Date( '2023-01-21T12:34:56Z' );
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
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-31T12:34:56Z' ) );
		rep.find( m => m.moveSan === 'Bg2' ).learningDueTime = new Date( '2023-01-21T12:34:56Z' ); // only Bg2 in the first branch
		rep.find( m => m.moveSan === 'd3' ).learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		for ( let i = 0; i < 100; i++ ) {
			const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line ).toHaveLength(7);
			expect( line[2].moveSan ).toEqual('Bg2');
			expect( line[2].branches[0].moveSan ).toEqual('Nf3');
		}
	} );
	test( 'first-move branch is returned for White', async () => {
		let rep = createRepertoire( [ ['Nf3'],['g3'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line[0] ).toHaveProperty('branches');
			expect( ['Nf3','g3'] ).toContain( line[0].branches[0].moveSan );
		}
	} );
	test( 'first-move branch is returned for Black', async () => {
		let rep = createRepertoire( [ ['e4','g6'],['e4','d6'] ], false );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
			expect( line[1] ).toHaveProperty('branches');
			expect( ['g6','d6'] ).toContain( line[1].branches[0].moveSan );
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
		rep.forEach( m => m.learningDueTime = new Date('2023-01-21T12:34:56' ) );
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
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		const { start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
		expect( start_ix ).toEqual(3);
	} );
	test( 'start_ix returned for Black', async () => {
		let rep = createRepertoire( [
			['e4','c5','Nf3','d6'],
			['e4','c5','Nc3','Nc6']
		], false );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		const { start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3] );
		expect( start_ix ).toEqual(2);
	} );
	test( 'returned move was not in last line', async () => {
		let rep = createRepertoire( [ ['e4'],['d4'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [1] );
			expect( line ).toHaveLength(1);
			expect( line[0].id ).toEqual(0);
			expect( start_ix ).toEqual(0);
		}
	} );
	test( 'return random first move, but not the one from last line', async () => {
		let rep = createRepertoire( [ ['e4'],['d4'],['c4'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
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
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
		expect( line.map(m=>m.moveSan) ).toEqual( ['e4','c6','d4'] );
		expect( start_ix ).toEqual(1);
	} );
	test( 'backtrack from lastLine to another White first-move', async () => {
		let rep = createRepertoire( [ ['e4','c5','Nf3','d6','d4'],['d4','d5','c4'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
		expect( line.map(m=>m.moveSan) ).toEqual( ['d4','d5','c4'] );
		expect( start_ix ).toEqual(0);
	} );
	test( 'returns line close to lastLine', async () => {
		let rep = createRepertoire( [ ['e4','c5','Nf3','d6','d4'],['e4','c5','Nf3','Nc6','Bb5'],['e4','c6','Nc3'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
			expect( line.map(m=>m.moveSan) ).toEqual( ['e4','c5','Nf3','Nc6','Bb5'] );
			expect( start_ix ).toEqual(3);
		}
	} );
	test( 'does not return line close to lastLine if not due', async () => {
		let rep = createRepertoire( [ ['e4','c5','Nf3','d6','d4'],['e4','c5','Nf3','Nc6','Bb5'],['e4','c6','Nc3'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-31T12:34:56Z' ) );
		rep.find( m => m.moveSan === 'Nc3' ).learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		for ( let i = 0; i < 100; i++ ) {
			const { line, start_ix } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z'), [0,1,2,3,4] );
			expect( line.map(m=>m.moveSan) ).toEqual( ['e4','c6','Nc3'] );
			expect( start_ix ).toEqual(1);
		}
	} );
});

describe( 'getLineForStudy cycle handling', async () => {
	test( 'cycle of undue moves is avoided', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3','Nc6','Ng1','Nb8'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-31T12:34:56Z' ) );
		rep.find(m=>m.moveSan==='e4').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( line ).toHaveLength(6);
	} );
	test( 'cycle of due moves is avoided', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3','Nc6','Ng1','Nb8'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-21T12:34:56Z' ) );
		const { line } = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( line ).toHaveLength(6);
	} );
});

describe( 'due_ix', async () => {
	test( 'due_ix for white', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3'] ] );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-31T12:34:56Z' ) );
		rep.find(m=>m.moveSan==='Nf3').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		let res = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( res.due_ix ).toEqual( [2] );

		rep.find(m=>m.moveSan==='e4').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		res = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( res.due_ix ).toEqual( [0,2] );
	} );
	test( 'due_ix for black', async () => {
		let rep = createRepertoire( [ ['e4','e5','Nf3','Nc6'] ], false );
		rep.forEach( m => m.learningDueTime = new Date( '2023-01-31T12:34:56Z' ) );
		rep.find(m=>m.moveSan==='e5').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		let res = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( res.due_ix ).toEqual( [1] );

		rep.find(m=>m.moveSan==='Nc6').learningDueTime = new Date( '2023-01-21T12:34:56Z' );
		res = await getLineForStudy( rep, new Date('2023-01-28T00:00:00Z') );
		expect( res.due_ix ).toEqual( [1,3] );
	} );
} );


/*
 * Test moveIsDue logic
 */

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
