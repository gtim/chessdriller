<script>
	export let data;
</script>

<h1>Database Check</h1>
<div class="narrow_container">
	<p>This page checks for some specific database inconsistencies that might indicate issues.</p>

	<h2 class:bad={data.unincludedStudiesWithMoves>0} class:good={data.unincludedStudiesWithMoves==0}>
		Unincluded studies with moves: {data.unincludedStudiesWithMoves.length}
	</h2>
	<ul>
		{#each data.unincludedStudiesWithMoves as study}
			<li>
				{study.name} (#{study.id}) by {study.user.lichessUsername} (#{study.user.id}):
				{study.moves.length} moves ({study.moves.filter((m)=>m.deleted).length} soft-deleted).
			</li>
		{/each}
	</ul>
</div>

<style>
	.narrow_container {
		width:512px;
		max-width:100%;
		margin:0 auto;
	}
	.good {
		color:darkgreen;
	}
	.bad {
		color:red;
		font-weight:bold;
	}
</style>
