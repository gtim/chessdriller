<script>

	import LStudyCard from '$lib/LStudyCard.svelte';

	import { fade, slide } from 'svelte/transition';

	import ConfirmModal from '$lib/ConfirmModal.svelte'
	import { openModal } from 'svelte-modals'

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	import RelativeTime from '@yaireo/relative-time';
	const relativeTime = new RelativeTime();


	export let id;
	export let name;
	export let repForWhite;
	export let previewFen;
	export let _count;
	export let lastModifiedOnLichess;

	
	let updated_ago = relativeTime.from( new Date(lastModifiedOnLichess) );
	let moves_string = _count.moves+' '+(repForWhite?'white':'black')+' move'+(_count.moves==1?'':'s'); // e.g. "8 black moves"

	function confirmRemoval(){
		openModal( ConfirmModal, {
			title: 'Remove study?',
			message: 'Remove the study <b>'+name+'</b> from your repertoire? Chessdriller remembers how well you knew the moves, in case you add them back later.',

			confirm: removeStudy,
			confirmLabel: 'Remove'
		} );
	}

	let removed = false;
	let removal_error;
	async function removeStudy() {
		const res = await fetch( '/api/lichess-study/'+id+'/uninclude', {method:'POST'} );
		const json = await res.json();
		if ( ! res.ok ) {
			removal_error = 'Removal failed ('+res.status+')';
		} else if ( ! json.success ) {
			removal_error = 'Removal failed: ' + json.message;
		} else {
			removed = true;
			dispatch( 'remove' );
		}
	}
	$: title = removed ? '<span style="text-decoration:line-through;">'+name+'</span>' : name;

</script>

<LStudyCard
	fen={previewFen}
	orientation={repForWhite?'white':'black'}
	{title}
>
	{#if removed}
		<p>Removed.</p>
	{:else}
		<p>{moves_string}.</p>
		<p>Updated <span title="{lastModifiedOnLichess}">{updated_ago}</span>.</p>
		<button class="remove" title="Remove study from repertoire" on:click={confirmRemoval}>&#x2715;</button>
	{/if}
	{#if removal_error}
		<p style="color:red;"><b>Error:</b> {removal_error}</p>
	{/if}
</LStudyCard>

<style>
	p {
		margin:0;
	}
	button.remove {
		position:absolute;
		top:3px;
		right:6px;
		padding:0;
		background:none;
		border:none;
		cursor:pointer;
		color:#800020;
	}
	button.remove:hover {
		font-weight:bold;
	}
</style>
