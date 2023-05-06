<script>
	export let move_pairs;
</script>

<div class="sheet">
	{#each move_pairs as pair, pair_ix}
		<div class="move_pair">
			<span class="move_number">{pair_ix+1}.</span>
			<span class="move">{pair[0].moveSan}</span>
			<span class="move">
			{#if pair.length == 2 && ! ( pair_ix == move_pairs.length - 1 && pair[1].ownMove ) }
				{pair[1].moveSan}
			{/if}
			</span>
		</div>
	{/each}
</div>

<style>
	.sheet {
		margin:30px 20px 0 20px;
		display: inline-flex;
		flex-wrap: wrap;
		flex-direction: column;
		align-content:flex-start;
		/* TODO: fill vertical space responsively and then add columns. Currently just keeps adding moves to bottom  */
	}
	.move, .move_number {
		display:inline-block;
		position:relative;
		top:2px;
	}
	.move_number {
		text-align:left;
		width:20px;
	}
	.move {
		text-align:left;
		width:50px;
	}
	.move_pair {
		width:fit-content;
		white-space:nowrap;
		padding:0 8px;
		border-color:rgba(40,43,40,0.3); /* #282B28 */
		border-style:solid;
		border-width:0 0 1px 0;
		margin:0 8px 2px 8px;
	}
</style>
