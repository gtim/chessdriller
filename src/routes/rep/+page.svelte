<script>

	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	import NewLStudy from '$lib/NewLStudy.svelte';
	import RepLStudy from '$lib/RepLStudy.svelte';

	let studies = null;
	$: unincluded_studies = studies === null ? null : studies.filter( (study) => !( study.included || study.hidden ) );
	$: included_studies   = studies === null ? null : studies.filter( (study) => study.included );
	$: hidden_studies     = studies === null ? null : studies.filter( (study) => study.hidden );
	async function getStudies() {
		const res = await fetch( '/api/lichess-study' );
		const json = await res.json();
		studies = json.studies;
	}
	async function getStudiesTwice() {
		// Stagger getStudies to deal with some request timing issues
		await getStudies();
		setTimeout( getStudies, 500 );
	}

	onMount( async () => {
		await getStudies();
		new_studies_promise = getNewStudies();
	} );

	let new_studies_promise;
	let new_studies_error;
	async function getNewStudies() {
		const res = await fetch( '/api/lichess-study/fetch-new' );
		const json = await res.json();
		if ( ! res.ok ) {
			new_studies_error = 'Request failed ('+res.status+')';
		}
		if ( ! json.success ) {
			new_studies_error = json.message;
		}

		if ( json.num_new_studies > 0 || json.num_updates_fetched > 0 || json.num_renamed_studies > 0 || json.num_removed_studies > 0 ) {
			getStudies();
		}
		return json;
	}

	async function unhide(studyId) {
		await fetch( '/api/lichess-study/'+studyId+'/hidden/false', {method:'POST'} );
		getStudies();
	}

	const [send, receive] = crossfade({
		duration: 750,
		easing: cubicInOut,
		fallback: fade
	});
	
	// component array necessary to call redrawBoard() after animation
	let unincluded_study_components = [];

</script>

<div class="narrow_container">
	<h1>Repertoire</h1>
	{#if new_studies_error}
		<p style="color:red;"><small>Error checking Lichess for new studies: {new_studies_error}</p>
	{/if}
</div>


	{#if studies !== null && studies.length == 0}
		<div class="narrow_container">
			<p>No studies were found in your Lichess account. To use Chessdriller, <a href="https://lichess.org/study" target="_blank" rel="noopener noreferrer">create a Lichess study</a> (via web, not the app), input the moves you're memorizing, and refresh this page.</p>
		</div>
	{/if}

	{#if included_studies !== null}
		<div class="studies_container">
			<div class="included_studies"
				class:grid_single_element={included_studies.length<=1}
			>
			{#each included_studies as study (study.id) }
				<div animate:flip={{duration:750, easing: cubicInOut }} in:receive|local="{{key:study.id}}" out:send|local="{{key:study.id}}">
					<RepLStudy {...study} on:change={getStudiesTwice} />
				</div>
			{/each}
			</div>
		</div>
	{/if}

<!-- unincluded studies -->

	{#if unincluded_studies !== null }
		{#if unincluded_studies.length > 0}
			<div class="narrow_container" out:fade|local>
				<p out:fade|local>
				{#if unincluded_studies.length == 1}
					The below study has not been added to your repertoire. You can either add it (+), or hide it (&#x2715;). 
				{:else}
					The below {unincluded_studies.length} studies have not been added to your repertoire. You can either add them (+), or hide them (&#x2715;).
				{/if}
				Hidden studies can always be unhidden later.
				</p>
			</div>
		{/if}
		<div class="studies_container">
			<div class="unincluded_studies"
				class:grid_single_element={unincluded_studies.length<=1}
			>
			{#each unincluded_studies as study, i (study.id) }
				<div 
					animate:flip={{duration:750, easing: cubicInOut }}
					in:receive|local="{{key:study.id}}" out:send|local="{{key:study.id}}"
					on:introend={()=>unincluded_study_components[i].redrawBoard()}
				>
					<NewLStudy {...study}
						on:change={getStudiesTwice}
						on:included={getStudiesTwice}
						bind:this={unincluded_study_components[i]}
					/>
				</div>
			{/each}
			</div>
		</div>
	{/if}

	{#if hidden_studies !== null}
		<div class="narrow_container">
			<p class="hidden_studies"><small>
				{#if hidden_studies.length > 0}
					Hidden studies, not part of your repertoire:
				{/if}
				{#each hidden_studies as study, i (study.id)}
					<span in:receive|local="{{key:study.id}}" out:send|local="{{key:study.id}}">
						<a href="#?" on:click|preventDefault={()=>unhide(study.id)} title="Unhide this study">{study.name}</a><!--
					--></span><!--
					-->{i < hidden_studies.length - 2 ? ', ' : ( i == hidden_studies.length - 2 ? ' and ' : '.' ) }<!--
				-->{/each}
			</small></p>
		</div>
	{/if}


<style>
	.narrow_container {
		width:100%;
		max-width:512px;
		margin:0 auto;
	}
	.studies_container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.unincluded_studies, .included_studies {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px,1fr)); /* 350px: LStudyCard width */
		max-width: min(100%, 1100px ); /* 1100px =~ 3*350px */
		grid-gap: 20px;
		margin-bottom:20px;
		justify-content: center;
	}
	/* class to apply on study lists with just one element in order to center */
	.grid_single_element {
		grid-template-columns: 1fr;
	}
	/*.unincluded_studies { }*/
	/*.included_studies { }*/
	.hidden_studies {
		margin-top:32px;
	}
</style>
