<script>

	import { Chessground } from 'svelte-chessground';
	import { Chess } from 'chess.js'; // Chess logic for finding valid moves
	import { onMount } from 'svelte';

	import './chessground.base.css';
	import './chessground.brown.css';
	import './chessground-pieces.css';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	const Delay_before_opponent_move = 250;
	const Delay_before_wrong_move_undo = 250;
	
	export let line; // line is an array of moves
	export let start_move_ix; // move index (of line[]) for the first move to show; fast-forward to that one
	let current_move_i = 0;
	let is_mounted = false;
	$: orientation = line && line[0].ownMove ? 'white' : 'black';
	let container;
	

	// Chess logic from chess.js 
	const chess = new Chess();

	// Board from Chessground
	let chessground;
	const config = {
		premovable: { enabled: false },
		coordinates: false,
	};

	// Reset board when line is changed
	$: if ( line && is_mounted ) {
		resetBoard();
	}

	onMount(async () => {
		is_mounted = true;
	});

	// Reset the board to the current line and start_move_ix
	function resetBoard() {
		current_move_i = 0;
		// Load FEN from current move (should always be initial position)
		console.assert( line[current_move_i].fromFen == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq' );
		chess.load( line[current_move_i].fromFen + ' - 1 1'); 
		console.assert( chess.turn() === 'w' );
		chessground.set({
			orientation: orientation,
			fen: chess.fen(), 
			turnColor: chess.turn() === 'w' ? 'white' : 'black',
		});

		// Move to right point if we're not at the start move
		while ( current_move_i < start_move_ix ) {
			stepOneMoveForward();
		}

		// Let player/computer make the first move
		if ( line[current_move_i].ownMove ) {
			allowBoardInput();
		} else {
			playOpponentMove();
		}
	}

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
		const correct = chess_move.san === line[current_move_i].moveSan;
		const container_rect = container.getBoundingClientRect();
		const [ relX, relY ] = keyToRelPos( dest );
		dispatch( 'move', {
			move_id: line[current_move_i].id,
			move_ix: current_move_i,
			correct: correct,
			guess: chess_move.san,
			dest_pos: { x: container_rect.x + relX, y: container_rect.y + relY }
		} );
		if ( ! correct ) {
			setTimeout( ()=>{
				chess.undo();
				chessground.set({
					fen: chess.fen(),
					lastMove: undefined,
				});
				allowBoardInput();
			}, Delay_before_wrong_move_undo );
		} else {
			const turnColor = chess.turn() === 'w' ? 'white' : 'black';
			chessground.set({ turnColor: turnColor });
			current_move_i++;
			if ( current_move_i == line.length ) {
				lineFinished();
			} else {
				setTimeout( playOpponentMove, Delay_before_opponent_move );
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
		dispatch( 
			'lineFinished',
			{move_ids:line.map(m=>m.id)}
		);
	}

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

	// turn square key (e.g. e4) to relative px position on the board.
	// expects valid input, returns center of the square
	function keyToRelPos( key ) {
		const square_side = container.clientWidth / 8;
		const x = ( key.charCodeAt(0) - 97 + 0.5 ) * square_side;
		const y = ( 8 - key.charAt(1) + 0.5 ) * square_side;
		if ( orientation == 'white' ) {
			return [x, y];
		} else {
			return [ container.clientWidth - x, container.clientWidth - y ];
		}
	}
</script>

<div style="width:100%;max-width:512px;aspect-ratio:1;" bind:this={container}>
	<Chessground className="cg-print" {config} bind:this={chessground} />
</div>

