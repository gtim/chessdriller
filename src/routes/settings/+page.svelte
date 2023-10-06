<script lang="ts">
	import { enhance } from "$app/forms";
	export let data;
</script>

<h1>Settings</h1>
<div class="narrow_container">
	<p>You are logged in as {data.lichessUsername}.</p>
	<form use:enhance method="post">
		<input type="submit" class="cdbutton" value="Sign out" />
	</form>
	<p>You can <a href="/settings/export">export your data</a> any time you like.</p>
</div>

<style>
	.narrow_container {
		width:100%;
		max-width:512px;
		margin:0 auto;
	}
</style>
