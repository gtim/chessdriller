<!-- svelte-ignore unused-export-let -->
<script>

	import { fade } from 'svelte/transition';
	import { tweened } from 'svelte/motion';

	import LStudyCard from '$lib/LStudyCard.svelte';

	import ConfirmModal from '$lib/ConfirmModal.svelte'
	import { openModal } from 'svelte-modals'

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let id;
	export let lichessId;
	export let name;
	export let repForWhite;
	export let previewFen;
	export let numOwnMoves;
	export let lastModifiedOnLichess;
	export let removedOnLichess;
	export let updates = [];

	// Below props are not used, but exported to avoid warnings when the Study is spread onto this prop.
	export let lastFetched;
	export let included;
	export let hidden;
	export let guessedColor;

	
	let error_msg;

	/*
	 * Removal (Uninclusion)
	 */

	function confirmRemoval(){
		openModal( ConfirmModal, {
			title: 'Remove from repertoire?',
			message: 'Remove the study <b>'+name+'</b> from your repertoire? Chessdriller remembers how well you knew the moves, in case you add them back later.',

			confirm: removeStudy,
			confirmLabel: 'Remove'
		} );
	}

	let removed = false;
	async function removeStudy() {
		const res = await fetch( '/api/lichess-study/'+id+'/uninclude', {method:'POST'} );
		const json = await res.json();
		if ( ! res.ok ) {
			error_msg = 'Removal failed ('+res.status+')';
		} else if ( ! json.success ) {
			error_msg = 'Removal failed: ' + json.message;
		} else {
			removed = true;
			dispatch( 'change' );
		}
	}
	$: title = removed ? '<span style="text-decoration:line-through;">'+name+'</span>' : name;

	/*
	 * Removing included study after removed from Lichess
	 */

	function confirmLichessRemoval() {
		openModal( ConfirmModal, {
			title: 'Delete study?',
			message: 'The study <b>'+name+'</b> was not found on Lichess anymore. Would you like to delete it from Chessdriller too?',
			confirm: deleteStudy,
			confirmLabel: 'Delete'
		} );
	}
	async function deleteStudy() {
		const res = await fetch( '/api/lichess-study/'+id+'/delete', {method:'POST'} );
		const json = await res.json();
		if ( ! res.ok ) {
			error_msg = 'Deletion failed ('+res.status+')';
		} else if ( ! json.success ) {
			error_msg = 'Deletion failed: ' + json.message;
		} else {
			dispatch( 'change' );
		}
	}

	/*
	 * Updating
	 */

	$: update = updates.length > 0 ? updates[0] : null;
	async function applyUpdate() {
		const res = await fetch( '/api/lichess-study/'+id+'/update/apply', {method:'POST'} );
		const json = await res.json();
		if ( ! res.ok ) {
			error_msg = 'Applying update failed ('+res.status+')';
		} else if ( ! json.success ) {
			error_msg = 'Applying update failed: ' + json.message;
		} else {
			dispatch( 'change' );
		}
	}


	const numOwnMovesTweened = tweened( numOwnMoves );
	$: numOwnMovesTweened.set( numOwnMoves );
	$: color = repForWhite ? 'white' : 'black';
	$: moves_string = Math.round($numOwnMovesTweened) +' '+color+' move'+(numOwnMoves==1?'':'s'); // e.g. "8 black moves"

</script>

<LStudyCard
	fen={previewFen}
	orientation={color}
	{title}
>
	{#if removed}
		<p>Removed.</p>
	{:else}
		<p>{moves_string}.</p>
		<button class="remove" title="Remove study from repertoire" on:click={confirmRemoval}>&#x2715;</button>
	{/if}
	{#if removedOnLichess}
		<button
			class="cdbutton" style="font-weight:bold;color:darkred;"
			title="This study can't be found on Lichess anymore. Delete it from Chessdriller too?"
			on:click={confirmLichessRemoval}
		>
			Not found on Lichess.<br/>
			Delete study?
		</button>
	{:else if update && ( update.numNewMoves > 0 || update.numRemovedMoves > 0 ) }
		<button
			class="cdbutton"
			title="Update {name} with {update.numNewOwnMoves} new {color} move{update.numNewOwnMoves==1?'':'s'} and {update.numRemovedOwnMoves} removed {color} move{update.numRemovedOwnMoves==1?'':'s'}."
			on:click={applyUpdate}
			in:fade|local
		>
			Update:
			+{update.numNewOwnMoves} move{update.numNewOwnMoves==1?'':'s'}<!--
			-->{#if update.numRemovedOwnMoves > 0},
				-{update.numRemovedOwnMoves} move{update.numRemovedOwnMoves==1?'':'s'}
			{/if}
		</button>
	{/if}
	{#if error_msg}
		<p style="color:red;"><b>Error:</b> {error_msg}</p>
	{/if}
</LStudyCard>

<style>
	p {
		margin:0;
	}
	button.remove {
		position:absolute;
		padding:0;
		background:none;
		border:none;
		cursor:pointer;
		color:#800020;
	}
	button.remove:hover {
		font-weight:bold;
	}
	button.remove {
		top:3px;
		right:6px;
	}
</style>
