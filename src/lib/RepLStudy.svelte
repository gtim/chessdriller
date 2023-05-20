<!-- svelte-ignore unused-export-let -->
<script>

	import LStudyCard from '$lib/LStudyCard.svelte';

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
	export let updates = [];

	// Below props are not used, but exported to avoid warnings when the Study is spread onto this prop.
	export let lichessId;
	export let lastFetched;
	export let included;
	export let hidden;
	export let guessedColor;

	
	let updated_ago = relativeTime.from( new Date(lastModifiedOnLichess) );
	let moves_string = _count.moves+' '+(repForWhite?'white':'black')+' move'+(_count.moves==1?'':'s'); // e.g. "8 black moves"

	let error_msg;

	/*
	 * Removal
	 */

	function confirmRemoval(){
		openModal( ConfirmModal, {
			title: 'Remove study?',
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
	 * Updating
	 */

	$: update = updates.length > 0 ? updates[0] : null;
	async function fetchUpdate() {
		const res = await fetch( '/api/lichess-study/'+id+'/update/fetch', {method:'POST'} );
		const json = await res.json();
		if ( ! res.ok ) {
			error_msg = 'Fetching update failed ('+res.status+')';
		} else if ( ! json.success ) {
			error_msg = 'Fetching update failed:: ' + json.message;
		} else {
			updates = [ json.update ];
		}
	}
	async function applyUpdate() {
		alert('not implemented');
	}

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
		<button class="remove" title="Remove study from repertoire" on:click={confirmRemoval}>&#x2715;</button>
		<button class="fetchUpdate" title="Check for updates" on:click={fetchUpdate}>&#x27F3;</button>
	{/if}
	{#if update && ( update.numNewMoves > 0 || update.numRemovedMoves > 0 ) }
		<button
			class="applyUpdate"
			title="Update {name} to the newest version of the Lichess study, with {update.numNewMoves} new move{update.numNewMoves==1?'':'s'} and {update.numRemovedMoves} removed move{update.numRemovedMoves==1?'':'s'}."
			on:click={applyUpdate}
		>
			Update:
			+{update.numNewMoves} move{update.numNewMoves==1?'':'s'}<!--
			-->{#if update.numRemovedMoves > 0},
				-{update.numRemovedMoves} move{update.numRemovedMoves==1?'':'s'}<!--
			-->{/if}.
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
	button.remove, button.fetchUpdate {
		position:absolute;
		padding:0;
		background:none;
		border:none;
		cursor:pointer;
		color:#800020;
	}
	button.remove:hover, button.fetchUpdate:hover {
		font-weight:bold;
	}
	button.remove {
		top:3px;
		right:6px;
	}
	button.fetchUpdate {
		font-size:16px;
		top:24px;
		right:4px;
	}

	button.applyUpdate {
		padding:3px 6px;
		background:#FFF6ED;
		border:1px solid rgba(40,43,40,0.7);
		border-radius:4px;
		cursor:pointer;
	}
	button.applyUpdate:hover {
		background:#F2E6DB;
	}
</style>
