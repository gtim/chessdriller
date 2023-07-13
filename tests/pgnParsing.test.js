import { singlePgnToMoves, pgndbToMoves, pgndbNumChapters, makePreviewFen } from '$lib/pgnParsing.js';
import fs from 'fs';

/*
 * Test makePreviewFen
 */

describe( 'makePreviewFen', () => {
	test('simple pgn', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/simple.pgn', 'utf8' );
		expect(
			'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
			makePreviewFen( pgn_content )
		);
	} );
	test('empty pgn', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/empty.pgn', 'utf8' );
		expect(
			'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
			makePreviewFen( pgn_content )
		);
	} );
} );


/*
 * Test singlePgnToMoves: the cm-pgn glue and main PGN parser
 */

describe( 'singlePgnToMoves', () => {
	test('simple pgn', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/simple.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 4 );
		expect( moves ).toContainEqual( {
			moveSan: 'e4',
			fromFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
			toFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
			repForWhite: true,
			ownMove: true
		} );
		expect( moves ).toContainEqual( {
			moveSan: 'c5',
			fromFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq',
			toFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq',
			repForWhite: true,
			ownMove: false
		} );
		expect( moves ).toContainEqual( {
			moveSan: 'Nf3',
			fromFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq',
			toFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq',
			repForWhite: true,
			ownMove: true
		} );
		expect( moves ).toContainEqual( {
			moveSan: 'd6',
			fromFen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq',
			toFen: 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq',
			repForWhite: true,
			ownMove: false
		} );
	});
	test('simple pgn, black', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/simple.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, false );
		expect( moves ).toHaveLength( 4 );
		expect( moves ).toMatchObject( [
			{
				moveSan: 'e4',
				ownMove: false,
				repForWhite: false
			},
			{
				moveSan: 'c5',
				ownMove: true,
				repForWhite: false
			},
			{
				moveSan: 'Nf3',
				ownMove: false,
				repForWhite: false
			},
			{
				moveSan: 'd6',
				ownMove: true,
				repForWhite: false
			}
		] );
	});
	test('recursive annotation variation', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/rav.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 11 );
		expect( moves.filter( (m) => m.moveSan === 'd5' ) ).toHaveLength( 2 );
		expect( moves.filter( (m) => m.fromFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq'       ) ).toHaveLength( 1 );
		expect( moves.filter( (m) => m.fromFen === 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq'     ) ).toHaveLength( 2 );
		expect( moves.filter( (m) => m.fromFen === 'rnbqkb1r/pppppppp/5n2/6B1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq' ) ).toHaveLength( 3 );
	});

	// cm-pgn 2.3.1 seems to fail parsing these three PGNs (cm-pgn/#17)
	test('two comments after final move', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/end-two-comments.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 2 );
		expect( moves.filter( (m) => m.moveSan === 'd4' ) ).toHaveLength( 1 );
		expect( moves.filter( (m) => m.moveSan === 'Nf6' ) ).toHaveLength( 1 );
	});
	test('two comments before variant', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/two-comments-before-variant.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 4 );
		expect( moves ).toMatchObject([
			{ moveSan: 'd4' },
			{ moveSan: 'Nf6' },
			{ moveSan: 'Bf4' },
			{ moveSan: 'Bg5' }
		]);
	});
	test('two comments before variant (three times)', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/two-comments-before-variant-thrice.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 8 );
	});

	// PGNs must have at least one move according to spec, but zero-moves PGNs should be handled anyway.
	test('empty PGN', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/empty.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 0 );
	});
	test('empty PGN with result', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/empty-draw.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 0 );
	});

	test('no ending newlines', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/no-newlines-at-end.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 4 );
	});

	// Real-life PGNs
	test('italian intro: no moves, only comment', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/italian.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 0 );
	} );
	test('blixt-SM: time notation every move', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/blixtsm.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 66 );
	} );
	test('italian, entire study', () => {
		// note: chessdriller is not intended for this type of PGNs, but should be able to parse them anyway.
		const pgn_content = fs.readFileSync( './tests/pgn/lichess_study_destroy-the-italian_by_abotofabot_2023.05.14.pgn', 'utf8' );
		const moves = pgndbToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 534 );
	} );
	test('chess.com game export', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/chesscomblitz.pgn', 'utf8' );
		const moves = singlePgnToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 135 );
	} );

	// Not a PGN
	test('not a PGN', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/not-a-pgn.txt', 'utf8' );
		expect( ()=>{ singlePgnToMoves(pgn_content,true) } ).toThrowError();
	} );

} );


/*
 * Test pgndbToMoves: concatenated PGN "database" files
 */

describe( 'pgndbToMoves', () => {
	test('pgn database', () => {
		// pgndbToMoves does not combine duplicate moves, this happens at the prisma layer.
		// As such, these expectations are different from those in uploadedPgn.test.js.
		const pgn_content = fs.readFileSync( './tests/pgn/database.pgn', 'utf8' );
		const moves = pgndbToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 15 );
		expect( moves.filter( (m) => m.moveSan === 'd4' ) ).toHaveLength( 3 );
		expect( moves.filter( (m) => m.moveSan === 'd5' ) ).toHaveLength( 1 );
		expect( moves.filter( (m) => m.moveSan === 'c4' ) ).toHaveLength( 2 );
		expect( moves.filter( (m) => m.moveSan === 'Nf3') ).toHaveLength( 2 );
		expect( moves.filter( (m) => m.fromFen === 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq' ) ).toHaveLength( 3 );
	});
	test('pgn database with no newlines at end', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/database-no-newlines-at-end.pgn', 'utf8' );
		const moves = pgndbToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 15 );
		expect( moves.filter( (m) => m.moveSan === 'd4' ) ).toHaveLength( 3 );
		expect( moves.filter( (m) => m.moveSan === 'd5' ) ).toHaveLength( 1 );
		expect( moves.filter( (m) => m.moveSan === 'c4' ) ).toHaveLength( 2 );
		expect( moves.filter( (m) => m.moveSan === 'Nf3') ).toHaveLength( 2 );
		expect( moves.filter( (m) => m.fromFen === 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq' ) ).toHaveLength( 3 );
	});
	test('italian, entire study', () => {
		// note: chessdriller is not intended for this type of PGNs, but should be able to parse them anyway.
		const pgn_content = fs.readFileSync( './tests/pgn/lichess_study_destroy-the-italian_by_abotofabot_2023.05.14.pgn', 'utf8' );
		const moves = pgndbToMoves( pgn_content, true );
		expect( moves ).toHaveLength( 534 );
	} );
	test('not a PGN', () => {
		const pgn_content = fs.readFileSync( './tests/pgn/not-a-pgn.txt', 'utf8' );
		expect( ()=>{ pgndbToMoves(pgn_content,true) } ).toThrowError();
	} );
	test('64-chapter PGN', async () => {
		const pgn_content = fs.readFileSync( './tests/pgn/64-chapters.pgn', 'utf8' );
		const moves = pgndbToMoves( pgn_content, false );
		expect( moves.filter( (m) => m.moveSan === 'a6' ) ).toHaveLength( 64 );
		expect( moves.filter( (m) => m.moveSan === 'a5' ) ).toHaveLength( 48 );
		expect( moves.filter( (m) => m.fromFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq' ) ).toHaveLength( 64 );
	} );
		 
} );

/*
 * Test pgndbNumChapters: concatenated PGN "database" files
 */

describe( 'pgndbNumChapters', () => {
	test('pgndbNumChapters', () => {
		expect( pgndbNumChapters( fs.readFileSync( './tests/pgn/database.pgn', 'utf8' ) ) ).toEqual( 3 );
		expect( pgndbNumChapters( fs.readFileSync( './tests/pgn/database-no-newlines-at-end.pgn', 'utf8' ) ) ).toEqual( 3 );
		expect( pgndbNumChapters( fs.readFileSync( './tests/pgn/lichess_study_destroy-the-italian_by_abotofabot_2023.05.14.pgn', 'utf8' ) ) ).toEqual( 16 );
		expect( ()=>{pgndbNumChapters( fs.readFileSync( './tests/pgn/not-a-pgn.txt', 'utf8' ) )} ).toThrowError();
		expect( pgndbNumChapters( fs.readFileSync( './tests/pgn/64-chapters.pgn', 'utf8' ) ) ).toEqual( 64 );
	});
} );

/*
 * Test guessColor
 */

test.todo('guessColor');
