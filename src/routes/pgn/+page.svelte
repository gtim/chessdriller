<script>

	import { enhance } from '$app/forms';

	export let form;
</script>

<h2>Upload PGN</h2>

<h3>Black Repertoire</h3>

<form method="POST" use:enhance>
	<input type="file" name="pgn" accept=".pgn" />
	<input type="submit" value="Upload"/>
</form>

{#if form?.success}
	<p>
	Success!
	Parsed one file
	with {form.num_games_parsed} PGN{form.num_games_parsed==1?'':'s'}
	and {form.num_moves_parsed} move{form.num_moves_parsed==1?'':'s'}.
	Added {form.num_moves_added} new move{form.num_moves_added==1?'':'s'}.
	</p>
{/if}
