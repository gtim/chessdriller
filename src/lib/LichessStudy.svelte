<script>

	import { Chessground } from 'svelte-chessground';
	import { createEventDispatcher } from 'svelte';
	import { fade, slide } from 'svelte/transition';

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

	let adding_state = 0;
	let including_promise;
	function addWhite() {
		including_promise = add(true);
	}
	function addBlack() {
		including_promise = add(false);
	}
	async function add( repForWhite ) {
		if ( adding_state != 1 ) {
			return;
		}
		console.log('adding..' + repForWhite );
		adding_state = 2;
		const res = await fetch(
			'/api/lichess-study/'+id+'/include/' + ( repForWhite ? 'white' : 'black' ),
			{method:'POST'}
		);
		const json = await res.json();
		if ( json.success ) {
			dispatch( 'included' );
			return json;
		} else {
			throw new Error(json.message);
		}
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
	{#if adding_state == 0}
		<p><a href="#" class="add" on:click|preventDefault={()=>adding_state=1}>+ Add to repertoire</a></p>
	{:else if adding_state == 1}
		<p in:slide|local>Which color?
			<button class="add_white" on:click|once={addWhite}>White</button>
			<button class="add_black" on:click|once={addBlack}>Black</button>
		</p>
	{:else if adding_state == 2}
		{#await including_promise}
			<p in:slide|local>Adding to repertoire...</p>
		{:then json}
			<p in:slide|local>Done!</p>
		{:catch error}
			<p in:slide|local style="color:red;"><span style="font-weight:bold;">Error</span>: {error.message}</p>
		{/await}
	{/if}
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
	
	button.add_white, button.add_black {
		cursor:pointer;
		padding:3px 6px;
		border:1px solid black;
		border-radius:4px;
	}
	button.add_white {
		background-color:#fff;
		color:black;
	}
	button.add_white:hover {
		background-color:#eee;
	}
	button.add_black {
		background-color:#000;
		color:white;
	}
	button.add_black:hover {
		background-color:#333;
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
		font-size:18px;
		font-weight:bold;
		margin:8px 0;
	}
	p {
		margin:0;
	}
</style>
