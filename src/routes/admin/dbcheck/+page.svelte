<script>
	export let data;
</script>

<h1>Database Check</h1>
<div class="narrow_container">
	<p>This page checks for some specific database inconsistencies that might indicate issues.</p>

	{#each data.checks as check}
		<h2 class:bad={check.items.length>0} class:good={check.items.length==0}>
			{check.title}: {check.items.length}
		</h2>
		<ul>
			{#each check.items as item}
				<li>{item}</li>
			{/each}
		</ul>
	{/each}
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
