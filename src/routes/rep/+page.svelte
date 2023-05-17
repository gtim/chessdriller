<script>

	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade, slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

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

	onMount( async () => {
		await getStudies();
	} );

	let new_studies_promise;
	async function getNewStudies() {
		const res = await fetch( '/api/lichess-study/fetch-new' );
		const json = await res.json();
		if ( ! res.ok ) {
			throw new Error( 'Request failed' );
		}
		if ( ! json.success ) {
			throw new Error( 'Request failed: ' + json.message );
		}

		if ( json.num_new_studies > 0 ) {
			getStudies();
		}
		return json;
	}

	async function lookForNewStudies() {
		new_studies_promise = getNewStudies();
	}

	async function unhide(studyId) {
		await fetch( '/api/lichess-study/'+studyId+'/hidden/false', {method:'POST'} );
		getStudies();
	}

</script>

<div class="narrow_container">
	<h1>Repertoire</h1>
</div>


	{#if studies !== null && studies.length == 0}
		<div class="narrow_container">
			<p>No studies were found in your Lichess account. To use Chessdriller, <a href="https://lichess.org/study">create a Lichess study</a>, input the moves you're memorizing, and refresh this page.</p>
		</div>
	{/if}

	{#if included_studies !== null && included_studies.length > 1}
		<div class="studies_container">
			<div class="included_studies">
			{#each included_studies as study (study.id) }
				<div animate:flip={{duration:750, easing: cubicInOut }} in:fade|local>
					<RepLStudy {...study}/>
				</div>
			{/each}
			</div>
		</div>
	{/if}

<!-- unincluded studies -->

	{#if unincluded_studies !== null && unincluded_studies.length > 0}
		<div class="narrow_container">
			<p>
			{#if unincluded_studies.length == 1}
				The below study has not been added to your repertoire. You can either add it, or hide it (&#x2715;). 
			{:else}
				The below {unincluded_studies.length} studies have not been added to your repertoire. You can either add them, or hide them (&#x2715;).
			{/if}
			Hidden studies can always be unhidden later.
			</p>
		</div>
		<div class="studies_container">
			<div class="unincluded_studies">
			{#each unincluded_studies as study (study.id) }
				<div animate:flip={{duration:750, easing: cubicInOut }} in:fade|local out:slide|local={{duration:500,axis:'x'}}>
				<NewLStudy {...study} on:change={getStudies} on:included={getStudies}/>
				</div>
			{/each}
			</div>
		</div>
	{/if}

	<div class="narrow_container">
		{#if new_studies_promise}
			{#await new_studies_promise}
				<p>Checking for new studies...</p>
			{:then new_studies}
				<p>Found {new_studies.num_new_studies} new {new_studies.num_new_studies==1?'study':'studies'}.</p>
			{:catch error}
				<p style="color:red;">{error}</p>
			{/await}
		{:else}
			<button on:click={lookForNewStudies}>Check for new studies</button>
		{/if}
	</div>

	{#if hidden_studies !== null && hidden_studies.length > 0}
		<div class="narrow_container">
			<p class="hidden_studies"><small>
				Hidden Lichess studies, not part of your repertoire:
				{#each hidden_studies as study, i}
					{study.name}
					(<a href="#" on:click|preventDefault={()=>unhide(study.id)}>unhide</a>){i<hidden_studies.length-1?', ':''}
				{/each}
			</small></p>
		</div>
	{/if}

<style>
	.narrow_container {
		width:512px;
		max-width:100%;
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
	.unincluded_studies { }
	.included_studies { }
	.hidden_studies {
		margin-top:32px;
	}
</style>
