<script>

	import LStudyCard from '$lib/LStudyCard.svelte';

	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';

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

	let card;
	export const redrawBoard = () => {
		if ( card )
			card.redrawBoard();
	};
</script>

<LStudyCard
	fen={previewFen}
	orientation={guessedColor=='b'?'black':'white'}
	title={name}
	included={false}
	bind:this={card}
>
	<button class="hide" title="Remove study from this list" on:click={hide}>&#x2715;</button>
	{#if adding_state == 0}
		<p><a href="#" class="add" on:click|preventDefault={()=>adding_state=1}>+ add to repertoire</a></p>
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
</LStudyCard>

<style>
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

	button.hide {
		position:absolute;
		top:3px;
		right:6px;
		padding:0;
		background:none;
		border:none;
		cursor:pointer;
		color:#800020;
	}
	button.hide:hover {
		font-weight:bold;
	}
	p {
		margin:0;
	}
</style>
