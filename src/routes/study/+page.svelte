<script>

	import StudyBoard from '$lib/StudyBoard.svelte';
	import { onMount } from 'svelte';

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
		last_progress_move_ix = Math.max( start_move_ix - 1, 0 );
		console.log(json);
	}

	let error_text = "";
	let stats;


	let last_progress_move_ix = 0;

	async function onMove(e) {
		updateStats();
		if ( e.detail.correct ) {
			console.log('yes! move ID: ' + e.detail.move_id);
			last_progress_move_ix = e.detail.move_ix;
			progress_line[last_progress_move_ix].class ||= 'right';
			if ( last_progress_move_ix > 0 ) {
				progress_line[last_progress_move_ix-1].class ||= 'right';
			}
		} else {
			console.log('no:( move ID: ' + e.detail.move_id);
			progress_line[e.detail.move_ix].class = 'wrong';
			if ( e.detail.move_ix > 0 ) {
				progress_line[e.detail.move_ix-1].class = 'wrong';
			}
		}
		fetch( '/api/study/move', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				move_id: e.detail.move_id,
				correct: e.detail.correct,
				guess:   e.detail.guess
			})
		})
		.then( (res) => res.json() )
		.then( (data) => {
			if ( data.success ) {
				error_text = '';
			} else { 
				error_text = 'API call failed: ' + data.error;
			}
		} );
	}
	function lineFinished(e) {
		console.log('nice!');
		const last_line_move_ids = e.detail.move_ids;
		setTimeout(()=>{
			studyNextLine( last_line_move_ids );
		}, delay_after_line_ms );
	}

	async function updateStats() {
		fetch( '/api/stats' )
		.then( (res) => res.json() )
		.then( (data) => {
			if ( data.success ) {
				stats = data.stats;
			} else { 
				// TODO
			}
		} );
	}

	onMount( () => {
		studyNextLine();
		updateStats();
	} );
	
</script>

<h2>Study Black Repertoire</h2>

{#if line}
	<StudyBoard {line} {start_move_ix} on:move={onMove} on:lineFinished={lineFinished} />
{/if}

{#if line}
	<p>
	{#each progress_line.slice(0,last_progress_move_ix+2) as move, ix}
		{#if ix % 2 == 0}
			{1+ix/2}.
		{/if}
		<span class="{move.class}">{move.moveSan+' '}</span>
	{/each}
	</p>
{/if}

{#if error_text}
	<p class="error">{error_text}</p>
{/if}

{#if stats}
	<p>{stats.moves_due} move{stats.moves_due==1?'':'s'} due</p>
{/if}

<style>
	.right {
		color:green;
	}
	.wrong {
		color:red;
	}
	.error {
		color:red;
		font-weight:bold;
	}
</style>
