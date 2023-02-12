<script>

	import { enhance } from '$app/forms';

	export let form;
</script>

<h2>Upload PGN</h2>

<form method="POST" use:enhance>
	<label for="pgn">Upload PGN:</label>
	<input type="file" name="pgn" accept=".pgn" />
	<input type="submit" value="Upload"/>
</form>

{#if form?.success}
	<p>ok!</p>
{/if}
