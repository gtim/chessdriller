<script>

	import StudyBoard from '$lib/StudyBoard.svelte';

	const delay_after_line_ms = 500;
	
	let line;
	$: progress_line = JSON.parse( JSON.stringify( line || [] ) ); // deep copy
	let start_move_ix;
	async function studyNextLine( last_line_move_ids = [] ) {
		const response = await fetch( '/api/study?' + new URLSearchParams({
			color: 'b',
			last: JSON.stringify(last_line_move_ids),
		}) );
		const json = await response.json();
		line = json.line;
		start_move_ix = json.start_ix;
		console.log(json);
	}


	let lastRightMoveIx = 0;

	function rightMove(e) {
		console.log('yes! move ID: ' + e.detail.move_id);
		lastRightMoveIx = e.detail.move_ix;
		progress_line[lastRightMoveIx].class ||= 'right';
		if ( lastRightMoveIx > 0 ) {
			progress_line[lastRightMoveIx-1].class ||= 'right';
		}
	}
	function wrongMove(e) {
		console.log('no:( move ID: ' + e.detail.move_id);
		progress_line[e.detail.move_ix].class = 'wrong';
		if ( e.detail.move_ix > 0 ) {
			progress_line[e.detail.move_ix-1].class = 'wrong';
		}
	}
	function lineFinished(e) {
		console.log('nice!');
		const last_line_move_ids = e.detail.move_ids;
		setTimeout(()=>{
			studyNextLine( last_line_move_ids );
		}, delay_after_line_ms );
	}

	
</script>

<h2>Study Black Repertoire</h2>

<button on:click={()=>studyNextLine()}>study line</button>
<button on:click={()=>studyNextLine(line.map(m=>m.id))}>study next line</button>

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
	{#each progress_line.slice(0,lastRightMoveIx+2) as move, ix}
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
