<script>

	import { fade, slide } from 'svelte/transition';

	import RelativeTime from '@yaireo/relative-time';
	const relativeTime = new RelativeTime();

	export let id;
	export let repForWhite;
	export let filename;
	export let uploaded;
	export let content;
	export let _count;

	let show_content = false;
</script>

<div class="pgn">
	<p class="filename">{filename}</p>
	<button class="delete" title="Delete PGN" on:click={()=>alert('not implemented yet')}>&#x2715;</button>
	<p>
		{repForWhite?'White':'Black'} repertoire.
		{_count.moves} move{_count.moves==1?'':'s'}.
		Uploaded <span title="{uploaded}">{relativeTime.from((uploaded))}</span>.
	</p>
	{#if content.length == 0}
		<p>This file is empty.</p>
	{:else}
		<p><a href="#" on:click|preventDefault="{()=>show_content=!show_content}">{show_content?'Hide':'Show'} file contents</a></p>
		{#if show_content}
			<div class="pgn_content" transition:slide|local>{content}</div>
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
		padding:4px 16px 4px 8px;
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
</style>
