<script lang="ts">
	export let data;
</script>

<h1>Admin</h1>
<div class="narrow_container">
	<p>
		<a href="/admin/feedback">view feedback</a>
		{#if data.numUnseenFeedback > 0}
			<span title="unseen feedback: {data.numUnseenFeedback}">*</span>
		{/if}
		| <a href="/admin/dbcheck">database sanity check</a>
	</p>
	<table>
		<tr><th>Username</th><th>Studies</th><th>PGNs</th><th>Moves</th><th>History</th></tr>
		{#each data.users as user}
			<tr>
				<td>{user.lichessUsername}</td>
				<td>{user._count.studies}</td>
				<td>{user._count.pgns}</td>
				<td>{user._count.moves}</td>
				<td>{user._count.history}</td>
			</tr>
		{/each}
	</table>
</div>

<style>
	.narrow_container {
		width:100%;
		max-width:512px;
		margin:0 auto;
	}
</style>
