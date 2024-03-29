<script lang="ts">

	import StudyBoard from '$lib/StudyBoard.svelte';
	import MoveFeedbackStamp from '$lib/MoveFeedbackStamp.svelte';
	import MoveSheet from '$lib/MoveSheet.svelte';
	import Spinner from '$lib/Spinner.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import gsap from 'gsap';

	import type { StudyLineResponse, MoveWithPossibleBranches as Move } from '$lib/scheduler';

	export let data;

	type Stats = {
		moves_total: number;
		moves_due: number;
		moves_learning: number;
		moves_review: number;
	};
	// TODO move event types into StudyBoard.svelte when that file is typescriptified
	type MoveEvent = {
		detail: {
			move_id: number;
			move_ix: number;
			result: 'correct' | 'wrong' | 'branch';
			guess: string;
			dest_pos: {
				x: number;
				y: number;
				file: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' |'h';
			}
		}
	};
	type FinishedEvent = {
		detail: {
			move_ids: number[]
		}
	};

	const delay_after_line_ms = 500;

	const nocache_headers: HeadersInit = new Headers();
	nocache_headers.append('pragma', 'no-cache');
	nocache_headers.append('cache-control', 'no-cache');
	
	let num_wrongs_this_move = 0;

	let line: Move[];
	let line_study_id = -1;
	let start_move_ix = -1;
	let due_ix: number[] = [];
	let line_source_name: string | null = null;


	// MoveSheet logic: TODO move pair_moves and move_pairs* into lib/MoveSheet.svelte (and simplify)
	function pair_moves( line: Move[] ) {
		let pairs = [];
		for ( let i = 0; i < line.length; i += 2 ) {
			pairs.push( line.slice( i, i+2 ) );
		}
		return pairs;
	}
	$: move_pairs = line ? pair_moves( line ) : [];
	$: move_pairs_to_display = !line || last_move_ix == -1 && line[0].ownMove ? []
	                           : move_pairs.slice(0, Math.ceil(last_move_ix/2)+1 );


	let nextline_promise: Promise<void>;
	async function studyNextLine( last_line_move_ids: number[] = [] ) {
		nextline_promise = fetch( '/api/study?' + new URLSearchParams({
			last: JSON.stringify(last_line_move_ids),
		}), { headers: nocache_headers } )
		.then( (res) => res.json() )
		.then( (data) => {
			if ( data.num_due_moves > 0 ) {
				line = data.line;
				due_ix = data.due_ix;
				start_move_ix = data.start_ix;
				last_move_ix = start_move_ix - 1;
				num_wrongs_this_move = 0;
				line_source_name = data.source_name;
				// line-study ID is only used to fuzz intervals from the same line and session equally
				// expected to be random float [0,1)
				line_study_id = Math.random(); 
			} else {
				review_finished = true;
				line_source_name = null;
			}
		} ).catch( (err) => {
			error_text = 'Failed asking for next line to study: ' + err.message;
			console.warn(error_text);
		} );
	}

	let studyBoard: StudyBoard;
	let error_text = "";
	let played_branches: Set<string> = new Set();
	let stats: undefined | Stats;
	let review_finished = false;

	let last_move_ix = -1;
	let last_fetchmove_promise: Promise<void>;

	async function onMove(e: MoveEvent) {
		if ( e.detail.result === 'correct' ) {
			last_move_ix = e.detail.move_ix;
			num_wrongs_this_move = 0;
			played_branches.clear();
		} else if ( e.detail.result === 'branch' ) {
			played_branches.add( e.detail.guess );
		} else if ( e.detail.result === 'wrong' ) {
			num_wrongs_this_move++;
			played_branches.clear();
		} else {
			throw new Error( 'invalid move result: ' + e.detail.result );
		}
		played_branches = played_branches;
		last_fetchmove_promise = fetch( '/api/study/move', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				move_id: e.detail.move_id,
				correct: e.detail.result === 'correct' || e.detail.result === 'branch',
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
					const mirrored = ( studyBoard.getOrientation() === 'white' ? e.detail.dest_pos.file === 'h' : e.detail.dest_pos.file === 'a' );
					const mfs = new MoveFeedbackStamp({
						target: document.body,
						props: { 
							value: data.interval.value,
							unit: data.interval.unit,
							x: e.detail.dest_pos.x,
							y: e.detail.dest_pos.y,
							mirrored
						},
						intro: true
					});
					mfs.$on('done', () => {
						mfs.$destroy();
					});
				}
			} else { 
				error_text = 'Sending move to server failed: ' + data.error;
			}
			updateStats();
		} ).catch( (err) => {
			error_text = 'Sending move to server failed: ' + err.message;
			console.warn(error_text);
		} );
	}
	function lineFinished(e: FinishedEvent) {
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

	// animate show-answer button every third wrong
	$: if ( num_wrongs_this_move >= 2 && num_wrongs_this_move % 3 == 1 ) {
		gsap.to( ".show_answer", {
			delay:0.4,
			keyframes: [
				{ scale: 1, duration: 0.1 },
				{ scale: 1.15, duration: 0.1 },
				{ scale: 0.98, duration: 0.1 },
				{ scale: 1, duration: 0.1 }
			]
		} );
	}

</script>

{#if review_finished}

	<div class="narrow_container">
		<h1>Study</h1>
		{#if stats && stats.moves_total == 0}
			<p>There are no moves to practice. Go to the <a href="/rep">repertoire tab</a> to start building your repertoire.</p>
		{:else}
			<p>You're done reviewing!</p>
		{/if}
	</div>

{:else}
	<div class="studygrid">

		<div id="stats">
			<p>
			{#if data.user.settingsStudyDisplayLineSource && line_source_name}
				<span title="This line is in your study named &quot;{line_source_name}&quot;">
					{line_source_name}.
				</span>
			{/if}
			{#if stats}
				<span title="You have {stats?stats.moves_due:0} move{stats&&stats.moves_due==1?'':'s'} to study right now.">
					{stats.moves_due} move{stats.moves_due==1?'':'s'} due.
				</span>
			{:else}
				&nbsp;
			{/if}
			</p>
		</div>

		<div style="display:flex;justify-content:center;align-items:center;">
			{#if line}
				<div style="position:relative;width:100%;max-width:512px;">
					<div style="position:absolute;right:6px;margin-top:-26px;">
						{#await Promise.all( [ last_fetchmove_promise, nextline_promise ] ) }
							<Spinner/>
						{/await}
					</div>
					<StudyBoard {line} {start_move_ix} on:move={onMove} on:lineFinished={lineFinished} bind:this={studyBoard} />
					{#if num_wrongs_this_move >= 2 }
						<button
							class="cdbutton show_answer"
							title="Show the right move"
							transition:fade on:click={()=>{studyBoard.showAnswer()}} 
						>Show answer</button>
					{/if}
					{#if line && line.slice(last_move_ix+1).length > 0 && last_move_ix >= Math.max(...due_ix)}
						<button 
							class="cdbutton skip_to_end"
							title="All due moves are reviewed, skip the end of this line"
							transition:fade
							on:click|once={()=>studyNextLine(line.map(m=>m.id))}
						>Skip to end</button>
					{/if}
				</div>
			{/if}
		</div>

		<div>
			{#if played_branches.size == 1 }
				<p class="branch_text">{[...played_branches][0]} is correct. Play your alternative move to continue.</p>
			{:else if played_branches.size > 1 }
				<p class="branch_text">{[...played_branches].join(' and ')} are correct. Play another alternative move to continue.</p>
			{/if}

			{#if error_text}
				<div class="error" transition:fade>{error_text}</div>
			{/if}
		</div>

		<div style="text-align:center;">
			{#if line}
				<MoveSheet move_pairs={move_pairs_to_display}/>
			{/if}
		</div>

	</div>
{/if}

<style>
	.narrow_container {
		width:100%;
		max-width:512px;
		margin:0 auto;
	}
	.studygrid {
		display: grid;
		grid-template-rows: auto auto auto 1fr;
		grid-template-columns: 1fr;
		height: 100%;
		width: 100%;
	}
	#stats {
		text-align:center;
	}
	.branch_text {
		text-align:center;
	}

	.show_answer, .skip_to_end {
		position:absolute;
		margin-top:6px;
	}
	.show_answer {
		left:0;
	}
	.skip_to_end {
		right:0;
	}
</style>
