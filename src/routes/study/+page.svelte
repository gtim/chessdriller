<script>

	import StudyBoard from '$lib/StudyBoard.svelte';
	
	let line;
	async function studyLine() {
		const response = await fetch('/api/study?color=b');
		const json = await response.json();
		line = json.line;
		console.log(json);
	}

	let lastRightMoveIx = 0;

	function rightMove(e) {
		console.log('yes! move ID: ' + e.detail.moveId);
		lastRightMoveIx = e.detail.moveIx;
	}
	function wrongMove(e) {
		console.log('no:( move ID: ' + e.detail.moveId);
	}

	
</script>

<h2>Study Black Repertoire</h2>

<button on:click={studyLine}>study line</button>

{#if line}
	<p>
	{#each line as move}
		{move.moveSan+' '} 
	{/each}
	</p>
{/if}

{#if line}
	<StudyBoard {line} on:rightMove={rightMove} on:wrongMove={wrongMove}/>
{/if}

{#if lastRightMoveIx}
	<p>
	{#each line.slice(0,lastRightMoveIx+2) as move, ix}
		{#if ix % 2 == 0}
			{1+ix/2}.
		{/if}
		{move.moveSan+' '} 
	{/each}
	</p>
{/if}

