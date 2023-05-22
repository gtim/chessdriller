<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<div>
	<form use:enhance method="post">
		<input type="submit" class="cdbutton" value="Click to sign out" />
	</form>
</div>

<style>
	div {
		padding-top:32px;
		text-align:center;
	}
</style>
