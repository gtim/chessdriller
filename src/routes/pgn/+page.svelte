<script>

	import { enhance } from '$app/forms';

	export let form;
</script>

<h2>Upload PGN</h2>

<h3>Black Repertoire</h3>

<form method="POST" use:enhance>
	<input type="file" name="pgn" accept=".pgn" />
	<input type="hidden" name="repForWhite" value="0" />
	<input type="submit" value="Upload Black Repertoire"/>
</form>

<h3>White Repertoire</h3>

<form method="POST" use:enhance>
	<input type="file" name="pgn" accept=".pgn" />
	<input type="hidden" name="repForWhite" value="1" />
	<input type="submit" value="Upload White Repertoire"/>
</form>


{#if form?.success}
	<p>
	Success!
	Parsed one file
	with {form.num_games_parsed} game{form.num_games_parsed==1?'':'s'}/chapter{form.num_games_parsed==1?'':'s'}
	and {form.num_moves_parsed} move{form.num_moves_parsed==1?'':'s'}.
	Added {form.num_moves_added} new move{form.num_moves_added==1?'':'s'} to your Black repertoire.
	</p>
{/if}
