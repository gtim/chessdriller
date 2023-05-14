<script>

	import { onMount } from 'svelte';

	import LichessStudy from '$lib/LichessStudy.svelte';

	let studies = [];
	$: unincluded_studies = studies.filter( (study) => !( study.included || study.hidden ) );
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

</script>

<h1>Repertoire</h1>
<div>

	{#if unincluded_studies.length > 0}
		<p>These studies were found on your Lichess account, but are not included in your repertoire. You can include them or hide them.</p>
		<div class="unincluded_studies">
		{#each unincluded_studies as study (study.id) }
			<LichessStudy {...study}/>
		{/each}
		</div>
	{/if}


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

	<p>(Note: these Lichess study connections are a work in progress and not yet actually used.)</p>
</div>

<style>
	.unincluded_studies {
		display:flex;
		flex-wrap:wrap;
		gap:20px 20px;
		justify-content:center;
	}
</style>
