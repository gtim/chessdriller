<script>
	import { enhance } from "$app/forms";
	export let data;
</script>

<h1>You</h1>
<div class="narrow_container">
	<p>You are {data.lichessUsername}.</p>
	<form use:enhance method="post">
		<input type="submit" class="cdbutton" value="Sign out" />
	</form>
</div>

<style>
	.narrow_container {
		width:512px;
		max-width:100%;
		margin:0 auto;
	}
</style>
