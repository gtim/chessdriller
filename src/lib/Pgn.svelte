<script>

	import { fade, slide } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	import RelativeTime from '@yaireo/relative-time';
	const relativeTime = new RelativeTime();

	export let id;
	export let repForWhite;
	export let filename;
	export let uploaded;
	export let content;
	export let _count;

	let show_content = false;

	let deleted = false;
	let num_deleted_moves;
	let deletion_error;
	async function deletePgn() {
		const res = await fetch( '/api/pgn/'+id+'/delete', {method:'POST'} );
		const json = await res.json();

		if ( ! res.ok ) {
			deletion_error = 'Deletion request failed ('+res.status+')';
		} else if ( ! json.success ) {
			deletion_error = 'Deletion failed: ' + json.message;
		} else {
			deleted = true;
			num_deleted_moves = json.num_deleted_moves;
			opacity.set(0.5);
			dispatch( 'delete' );
		}
	}
	let opacity = tweened(1,{duration:1000,easing:cubicInOut});
</script>

<div class="pgn" style="opacity:{$opacity};">
	<p class="filename" title="Internal ID: {id}" class:deleted>{filename}</p>
	{#if ! deleted}
		<button class="delete" title="Delete PGN" on:click|once={deletePgn}>&#x2715;</button>
	{/if}
	<p class:deleted>
		{repForWhite?'White':'Black'} repertoire.
		{_count.moves} move{_count.moves==1?'':'s'}.
		Uploaded <span title="{uploaded}">{relativeTime.from((uploaded))}</span>.
	</p>
	{#if deletion_error}
		<p style="color:red;" transition:fade|local>{deletion_error}</p>
	{/if}
	{#if deleted}
		<p><span style="font-weight:bold;">Deleted</span>: Removed {num_deleted_moves} move{num_deleted_moves==1?'':'s'} from your repertoire.</p>
	{:else}
		{#if content.length == 0}
			<p>This file is empty.</p>
		{:else}
			<button class="cdbutton" on:click|preventDefault="{()=>show_content=!show_content}">{show_content?'Hide':'Show'} file contents</button>
			{#if show_content}
				<div class="pgn_content" transition:slide|local>{content}</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	div.pgn {
		position:relative;
		background-color:#FFF6ED;
		border-radius:4px;
		border-color:rgba(40,43,40,0.3); /* #282B28 */
		border-style:solid;
		border-width:1px;
		padding:8px 16px 8px 12px;
		font-size:14px;
	}
	div.pgn_content {
		white-space:pre-wrap;
	}
	p {
		margin:0;
		padding:4px;
	}
	p.filename {
		font-family:monospace;
		line-height:1;
		word-break:break-all;
	}
	button.delete {
		position:absolute;
		top:3px;
		right:6px;
		padding:0;
		background:none;
		border:none;
		cursor:pointer;
		color:#800020;
	}
	button.delete:hover {
		font-weight:bold;
	}

	p.deleted {
		text-decoration:line-through;
	}

</style>
