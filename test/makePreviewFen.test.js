import { makePreviewFen } from '$lib/pgnImporter.js';
import fs from 'fs';

test('simple pgn', () => {
	const pgn_content = fs.readFileSync( './test/pgn/simple.pgn', 'utf8' );
	expect( 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3', makePreviewFen( pgn_content ) );
} );

test('empty pgn', () => {
	const pgn_content = fs.readFileSync( './test/pgn/empty.pgn', 'utf8' );
	expect( 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', makePreviewFen( pgn_content ) );
} );
