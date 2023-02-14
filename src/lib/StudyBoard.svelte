<script>

	import Chessground from '$lib/Chessground.svelte';
	import { Chess } from 'chess.js'; // Chess logic for finding valid moves
	import { onMount } from 'svelte';

	export let line; // array of moves
	let chessground;

	const chess = new Chess();
	chess.load( line[0].fromFen + ' - 1 1');
	const config = {
		fen: chess.fen(),
		orientation: 'black',
		turnColor: chess.turn() === 'w' ? 'white' : 'black',
		premovable: { enabled: false },
	};

	function playOpponentMove( move ) {
		console.assert( ! move.ownMove );
		const chess_move = chess.move( move.moveSan );
		chessground.move( chess_move.from, chess_move.to );
		allowBoardInput();
	}

	function checkMove( orig, dest ) {
		const chess_move = chess.move( { from: orig, to: dest } );
		if ( chess_move.san !== line[0].moveSan ) {
			// Incorrect move
			chess.undo();
			chessground.set({
				fen: chess.fen(),
				lastMove: undefined,
			});
			allowBoardInput();
		} else {
			// Correct move
			const turnColor = chess.turn() === 'w' ? 'white' : 'black';
			chessground.set({ turnColor: turnColor });
			line.shift();
			playOpponentMove( line.shift() );
		}
	}

	function allowBoardInput() {
		const turnColor = chess.turn() === 'w' ? 'white' : 'black';
		chessground.set({
			turnColor: turnColor,
			movable: {
				free: false,
				color: turnColor,
				dests: toDests(chess),
				events: {
					after: checkMove
				}
			}
		});
	}

	onMount(async () => {
		playOpponentMove( line[0] );
		line.shift();
	});

	function colorToMove( fen ) {
		return fen.split(' ')[1] === 'w' ? 'white' : 'black';
	}

	// find allowed piece destinations via chess.js logic.
	// GPL3 code from lichess-org/chessground-examples/src/utils.ts.
	function toDests(chess) {
		const dests = new Map();
		const squares = [
		  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
		  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
		  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
		  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
		  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
		  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
		  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
		  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
		];
		squares.forEach(s => {
			const ms = chess.moves({square: s, verbose: true});
			if (ms.length) dests.set(s, ms.map(m => m.to));
		});
		return dests;
	}
</script>

<div style="width:512px;height:512px;">
	<Chessground {config} bind:chessground />
</div>

