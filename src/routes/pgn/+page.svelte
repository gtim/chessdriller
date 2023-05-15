<script>

	import { enhance } from '$app/forms';

	export let form;
</script>

<div class="container">
	<h2>PGN files</h2>

	<p><a href="/rep">Connecting Lichess studies</a> is the main way to use Chessdriller. If you'd like to, though, you can use this page to upload PGNs directly. Your repertoire can contain both PGNs and connected Lichess studies.</p>

	<h3>Upload new PGN file</h3>

	<form method="POST" use:enhance>
		<p>
			<label for="pgn_input">PGN file:</label>
			<input type="file" id="pgn_input" name="pgn" accept=".pgn" />
		</p>
		<p>
			Repertoire for which color?
			<input type="radio" id="radio_white" name="color" value="w" />
			<label for="radio_white">White</label>
			or
			<input type="radio" id="radio_black" name="color" value="b" />
			<label for="radio_black">Black</label>
		</p>
		<input type="submit" value="Upload PGN"/>
	</form>

	{#if form?.success}
		<p>
		Success!
		Parsed one file
		with {form.num_moves_parsed} move{form.num_moves_parsed==1?'':'s'}.
		Added {form.num_moves_added} new move{form.num_moves_added==1?'':'s'} to your repertoire.
		</p>
	{:else if form?.message}
		<p><span style="font-weight:bold;color:red;">Error uploading PGN file:</span> {form.message}</p>
	{/if}
</div>

<style>
	div.container {
		width:512px;
		max-width:100%;
		margin:0 auto;
	}
</style>
