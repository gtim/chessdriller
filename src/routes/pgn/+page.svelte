<script>

	import { enhance } from '$app/forms';
	import Pgn from '$lib/Pgn.svelte';

	export let data;
	export let form;
</script>

<div class="narrow_container">
	<h1>PGN files</h1>

	<p><a href="/rep">Connecting Lichess studies</a> is the main way to use Chessdriller. If you'd like to, though, you can use this page to upload PGNs directly. Your repertoire can contain both PGNs and connected Lichess studies.</p>

	<h2>Upload new PGN file</h2>

	<form method="POST" use:enhance>
		<div style="margin-left:16px;">
			<p>
				<label for="pgn_input">PGN file:</label>
				<input type="file" id="pgn_input" name="pgn" accept=".pgn" />
			</p>
			<p>
				Repertoire for which color?<br/>
				<input type="radio" id="radio_white" name="color" value="w" />
				<label for="radio_white" style="margin-right:8px;">White</label>
				<input type="radio" id="radio_black" name="color" value="b" />
				<label for="radio_black">Black</label>
			</p>
			<input type="submit" class="cdbutton" value="Upload PGN"/>
		</div>
	</form>

	{#if form?.success}
		<p>
		Success!
		Parsed one file
		with {form.num_moves_parsed} move{form.num_moves_parsed==1?'':'s'}.
		Added {form.num_moves_added} new move{form.num_moves_added==1?'':'s'} to your repertoire.
		</p>
	{:else if form?.message}
		<div class="error">Error uploading PGN file: {form.message}</div>
	{/if}

	{#if data.pgns.length > 0}
		<h2>Your uploaded PGNs</h2>

		<p>
			These are all your uploaded PGNs. You can delete the PGNs ones you don't need, e.g. if you've uploaded a newer version or made a mistake.
			Moves in deleted PGNs are removed from your repertoire, unless the same moves exist in another PGN or connected Lichess study.
			Move progress is remembered and will be restored when you upload a PGN or connect a Lichess study with those moves.
		</p>

		<div class="pgn_list">
			{#each data.pgns as pgn}
				<Pgn {...pgn} />
			{/each}
		</div>
		
	{/if}
</div>

<style>
	div.narrow_container {
		width:512px;
		max-width:100%;
		margin:0 auto;
	}
	h2 {
		margin-top:32px;
	}
	div.pgn_list {
		display:flex;
		flex-direction:column;
		gap:20px;
	}
</style>
