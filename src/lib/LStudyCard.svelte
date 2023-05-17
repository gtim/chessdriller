<script>
	import { Chessground } from 'svelte-chessground';

	import './chessground.base.css';
	import './chessground.brown.css';
	import './chessground-pieces.css';

	export let fen;
	export let orientation;
	export let title;
</script>


<div class="study">
	<div class="board">
		<Chessground
			className="cg-print" coordinates={false}
			{fen} {orientation}
			viewOnly={true} disableContextMenu={false} config={{drawable:{enabled:false}}}
		/>
	</div>
	<h2>{@html title}</h2>
	<slot></slot>
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
	h2 {
		font-size:16px;
		font-weight:bold;
		margin:8px 0;
	}
	
</style>
