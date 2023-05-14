<script>

	import { Chessground } from 'svelte-chessground';

	import './chessground.base.css';
	import './chessground.brown.css';
	import './chessground-pieces.css';

	export let name;
	export let guessedColor;
	export let lichessId;
	export let previewFen;
</script>

<div class="study">
	<div class="board">
		<Chessground
			className="cg-print" coordinates={false}
			fen={previewFen} orientation={guessedColor=='b'?'black':'white'}
			viewOnly={true} disableContextMenu={false} config={{drawable:{enabled:false}}}
		/>
	</div>
	<button class="hide" title="Remove study from this list">&#x2715;</button>
	<h2>{name}</h2>
	<!--<p>(<a href="https://lichess.org/study/{lichessId}">view on lichess</a>)</p>-->
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
		top:4px;
		right:6px;
		padding:0;
		background:none;
		border:none;
		cursor:pointer;
	}
	.study button.hide:hover {
		font-weight:bold;
	}
	.study h2 {
		font-size:16px;
		font-weight:bold;
		margin:8px 0;
	}
	.study p {
		margin:0;
	}
</style>
