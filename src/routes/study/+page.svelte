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
	$: progress_line = JSON.parse( JSON.stringify( line || [] ) ); // deep copy
	let start_move_ix;
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
				last_progress_move_ix = Math.max( start_move_ix - 1, 0 );
				// line-study ID is only used to fuzz intervals from the same line and session equally
				// expected to be random float [0,1)
				line_study_id = Math.random(); 
			} else {
				review_finished = true;
			}
		});
	}

	let error_text = "";
	let stats;
	let review_finished = false;

	let last_progress_move_ix = 0;

	async function onMove(e) {
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
							x: m.x,
							y: m.y
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

	let m = { x: 0, y: 0 };
	function trackMouse(e) {
		m.x = e.clientX;
		m.y = e.clientY;
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
		<div on:mousemove={trackMouse} style="display:flex;justify-content:center;align-items:center;margin-top:100px;">
			<StudyBoard {line} {start_move_ix} on:move={onMove} on:lineFinished={lineFinished} />
		</div>
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

	{#if line && line.slice(last_progress_move_ix+1).filter(m=>m.isDue).length == 0}
		<p style="text-align:right;">
			line reviewed!
		</p>
		<button on:click|once={()=>studyNextLine(line.map(m=>m.id))}>skip</button>
	{/if}

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
