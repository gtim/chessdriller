<script>

	import { Chessground } from 'svelte-chessground';
	import { createEventDispatcher } from 'svelte';

	import './chessground.base.css';
	import './chessground.brown.css';
	import './chessground-pieces.css';

	const dispatch = createEventDispatcher();

	export let id;
	export let name;
	export let guessedColor;
	export let lichessId;
	export let previewFen;

	async function hide() {
		await fetch( '/api/lichess-study/'+id+'/hidden/true', {method:'POST'} );
		dispatch( 'change' );
	}
</script>

<div class="study">
	<div class="board">
		<Chessground
			className="cg-print" coordinates={false}
			fen={previewFen} orientation={guessedColor=='b'?'black':'white'}
			viewOnly={true} disableContextMenu={false} config={{drawable:{enabled:false}}}
		/>
	</div>
	<button class="hide" title="Remove study from this list" on:click={hide}>&#x2715;</button>
	<h2><a href="https://lichess.org/study/{lichessId}" target="_blank" rel="noopener noreferrer" title="Open study on Lichess">{name}</a></h2>
	<button>Add to repertoire</button>
	<br style="clear:both;"/>
</div>

<style>
	.study {
		position:relative;
		width:350px;
		max-width:100%;
		background-color:#FFF6ED;
		border-radius:4px;
		border-color:rgba(40,43,40,0.3); /* #282B28 */
		border-style:solid;
		border-width:1px;
	}
	.board {
		float: left;
		width:96px;
		margin-right:16px;
	}
	.study button.hide {
		position:absolute;
		top:3px;
		right:6px;
		padding:0;
		background:none;
		border:none;
		cursor:pointer;
		color:#800020;
	}
	.study button.hide:hover {
		font-weight:bold;
	}
	.study h2 {
		font-size:16px;
		font-weight:bold;
		margin:8px 0;
	}
</style>
