<script lang="ts">
	import { enhance } from "$app/forms";
	export let data;
	function updateStudyDisplayLineSource(event: Event) {
		const input = event.target as HTMLInputElement;
		input.form?.requestSubmit();
	}
</script>

<h1>Settings</h1>
<div class="narrow_container">
	<form use:enhance method="POST" action="?/logoff">
		<p>You are logged in as {data.user.lichessUsername}.
			<input type="submit" class="cdbutton" value="Sign out" />
		</p>
	</form>

	<h2>Settings</h2>
	<form use:enhance method="POST" action="?/update">
	<p>
		<input type="checkbox" id="settingsStudyDisplayLineSource" name="settingsStudyDisplayLineSource" bind:checked={data.user.settingsStudyDisplayLineSource} on:change={updateStudyDisplayLineSource} />
		<label for="settingsStudyDisplayLineSource">Display the current study name while studying</label>
	</p>
	</form>

	<h2>Data export</h2>
	<p>You can <a href="/settings/export">export your data</a> any time you like.</p>
</div>

<style>
	h2 {
		margin-top:24px;
	}
	.narrow_container {
		width:100%;
		max-width:512px;
		margin:0 auto;
	}
</style>
