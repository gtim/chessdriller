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
	<p>ok!</p>
{/if}
