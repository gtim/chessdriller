<script>

	import StudyBoard from '$lib/StudyBoard.svelte';
	import MoveFeedbackStar from '$lib/MoveFeedbackStar.svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	const delay_after_line_ms = 500;

	const nocache_headers = new Headers();
	nocache_headers.append('pragma', 'no-cache');
	nocache_headers.append('cache-control', 'no-cache');
	
	let line;
	let line_study_id;
	$: move_pairs = line ? pair_moves( line ) : [];
	$: move_pairs_to_display = !line || last_move_ix == -1 && line[0].ownMove ? []
	                           : move_pairs.slice(0, Math.ceil(last_move_ix/2)+1 );
	let start_move_ix;
	function pair_moves( line ) {
		let pairs = [];
		for ( let i = 0; i < line.length; i += 2 ) {
			pairs.push( line.slice( i, i+2 ) );
		}
		return pairs;
	}
	async function studyNextLine( last_line_move_ids = [] ) {
		fetch( '/api/study?' + new URLSearchParams({
			last: JSON.stringify(last_line_move_ids),
		}), nocache_headers )
		.then( (res) => res.json() )
		.then( (data) => {
			console.log(data);
			if ( data.num_due_moves > 0 ) {
				line = data.line;
				start_move_ix = data.start_ix;
				last_move_ix = start_move_ix - 1;
				// line-study ID is only used to fuzz intervals from the same line and session equally
				// expected to be random float [0,1)
				line_study_id = Math.random(); 
			} else {
				review_finished = true;
			}
		});
	}

	let studyBoard;
	let error_text = "";
	let stats;
	let review_finished = false;

	let last_move_ix = -1;

	async function onMove(e) {
		if ( e.detail.correct ) {
			console.log('yes! move ID: ' + e.detail.move_id);
			last_move_ix = e.detail.move_ix;
		} else {
			console.log('no:( move ID: ' + e.detail.move_id);
		}
		fetch( '/api/study/move', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				move_id: e.detail.move_id,
				correct: e.detail.correct,
				guess:   e.detail.guess,
				line_study_id: line_study_id
			})
		})
		.then( (res) => res.json() )
		.then( (data) => {
			if ( data.success ) {
				error_text = '';
				if ( data.interval.increased ) {
					if ( data.interval.value >= 110 && data.interval.unit == 'm' ) {
						data.interval.value = Math.round(data.interval.value/60);
						data.interval.unit = 'h';
					}
					const mfs = new MoveFeedbackStar({
						target: document.body,
						props: { 
							value: data.interval.value,
							unit: data.interval.unit,
							x: e.detail.dest_pos.x,
							y: e.detail.dest_pos.y
						},
						intro: true
					});
					mfs.$on('done', event => {
						mfs.$destroy();
					});
				}
			} else { 
				error_text = 'API call failed: ' + data.error;
			}
			updateStats();
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

{#if review_finished}

	<p>You're done reviewing!</p>

{:else}

	{#if line}
		<div style="display:flex;justify-content:center;align-items:center;margin-top:100px;">
			<StudyBoard {line} {start_move_ix} on:move={onMove} on:lineFinished={lineFinished} bind:this={studyBoard} />
		</div>
	{/if}

	{#if error_text}
		<div class="error"><p>
			<span style="font-weight:bold;">Error:</span>
			{error_text}
		</p></div>
	{/if}

	{#if line}
		<div class="sheet">
			{#each move_pairs_to_display as pair, pair_ix}
				<div class="move_pair">
					<span class="move_number">{pair_ix+1}.</span>
					<span class="move">{pair[0].moveSan}</span>
					<span class="move">
					{#if pair.length == 2 && ! ( pair_ix == move_pairs_to_display.length - 1 && pair[1].ownMove ) }
						{pair[1].moveSan}
					{/if}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if stats}
		<p id="stats">
			{stats.moves_due} move{stats.moves_due==1?'':'s'} due
		</p>
	{/if}

	{#if line && line.slice(last_move_ix+1).filter(m=>m.isDue).length == 0}
		<div style="text-align:right;">
			<p>line reviewed!</p>
			<button on:click|once={()=>studyNextLine(line.map(m=>m.id))}>skip</button>
		</div>
	{/if}

{/if}

<style>
	#stats {
		position:absolute;
		top:20px;
		right:20px;
	}
	.sheet {
		margin:30px 20px 0 20px;
		display: flex;
		flex-wrap: wrap;
		flex-direction: row;
		align-content:flex-start;
	}
	.sheet .move, .sheet .move_number {
		display:inline-block;
		position:relative;
		top:2px;
	}
	.sheet .move_number {
		width:20px;
	}
	.sheet .move {
		width:50px;
	}
	.sheet .move_pair {
		width:fit-content;
		padding:0 8px;
		border-color:rgba(40,43,40,0.3); /* #282B28 */
		border-style:solid;
		border-width:0 0 1px 0;
		margin:0 8px 2px 8px;
	}

	.error {
		border:solid 2px #93877E;
		color:#8B0000;
		font-weight:bold;
		width:fit-content;
		margin:16px auto 0 auto;
		padding:12px 16px;
	}
	.error p {
		margin:0;
		padding:0;
	}
</style>
