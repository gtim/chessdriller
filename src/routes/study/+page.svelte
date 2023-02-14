<script>

	import StudyBoard from '$lib/StudyBoard.svelte';
	
	let line;
	let start_move_ix;
	async function studyLine() {
		const response = await fetch('/api/study?color=b');
		//const response = await fetch('/api/study?color=b&last=[1,2,522,523,524,525,526,527,528,533,534,535]');
		const json = await response.json();
		line = json.line;
		start_move_ix = json.start_ix;
		console.log(json);
	}

	let lastRightMoveIx = 0;

	function rightMove(e) {
		console.log('yes! move ID: ' + e.detail.moveId);
		lastRightMoveIx = e.detail.moveIx;
		line[lastRightMoveIx].class ||= 'right';
		if ( lastRightMoveIx > 0 ) {
			line[lastRightMoveIx-1].class ||= 'right';
		}
	}
	function wrongMove(e) {
		console.log('no:( move ID: ' + e.detail.moveId);
		line[e.detail.moveIx].class = 'wrong';
		if ( e.detail.moveIx > 0 ) {
			line[e.detail.moveIx-1].class = 'wrong';
		}
	}
	function lineFinished(e) {
		console.log('nice!');
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
	<StudyBoard {line} {start_move_ix} on:rightMove={rightMove} on:wrongMove={wrongMove} on:lineFinished={lineFinished} />
{/if}

{#if lastRightMoveIx}
	<p>
	{#each line.slice(0,lastRightMoveIx+2) as move, ix}
		{#if ix % 2 == 0}
			{1+ix/2}.
		{/if}
		<span class="{move.class}">{move.moveSan+' '}</span>
	{/each}
	</p>
{/if}

<style>
	.right {
		color:green;
	}
	.wrong {
		color:red;
	}
</style>
