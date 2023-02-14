<script>

	import Chessground from '$lib/Chessground.svelte';
	import { Chess } from 'chess.js'; // Chess logic for finding valid moves
	import { onMount } from 'svelte';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	
	export let line; // line is an array of moves
	export let start_move_ix; // move index (of line[]) for the first move to show; fast-forward to that one
	let current_move_i = 0;
	

	// Chess logic from chess.js 
	const chess = new Chess();
	chess.load( line[current_move_i].fromFen + ' - 1 1');

	// Board from Chessground
	let chessground;
	const config = {
		fen: chess.fen(),
		orientation: 'black',
		turnColor: chess.turn() === 'w' ? 'white' : 'black',
		premovable: { enabled: false },
	};

	function stepOneMoveForward() {
		const chess_move = chess.move( line[current_move_i].moveSan );
		chessground.move( chess_move.from, chess_move.to );
		current_move_i++;
	}

	function playOpponentMove() {
		console.assert( ! line[current_move_i].ownMove );
		stepOneMoveForward();
		if ( current_move_i == line.length ) {
			lineFinished();
		} else {
			allowBoardInput();
		}
	}

	function checkMove( orig, dest ) {
		const chess_move = chess.move( { from: orig, to: dest } );
		const moveMessage = {
			moveId: line[current_move_i].id,
			moveIx: current_move_i
		};
		if ( chess_move.san !== line[current_move_i].moveSan ) {
			// Incorrect move
			dispatch( 'wrongMove', moveMessage );
			chess.undo();
			chessground.set({
				fen: chess.fen(),
				lastMove: undefined,
			});
			allowBoardInput();
		} else {
			// Correct move
			dispatch( 'rightMove', moveMessage );
			const turnColor = chess.turn() === 'w' ? 'white' : 'black';
			chessground.set({ turnColor: turnColor });
			current_move_i++;
			if ( current_move_i == line.length ) {
				lineFinished();
			} else {
				playOpponentMove();
			}
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
	
	function lineFinished() {
		chessground.set({
			movable: {}
		});
		dispatch( 'lineFinished' );
	}

	onMount(async () => {
		while ( current_move_i < start_move_ix ) {
			stepOneMoveForward();
		}
		if ( line[current_move_i].ownMove ) {
			allowBoardInput();
		} else {
			playOpponentMove();
		}
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

