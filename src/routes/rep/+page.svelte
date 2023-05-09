<script>
	let studies_promise = getStudies();
	async function getStudies() {
		const res = await fetch( '/api/lichess-study' );
		const json = await res.json();
		return json.studies;
	}

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
			studies_promise = getStudies();
		}
		return json;
	}

	async function lookForNewStudies() {
		new_studies_promise = getNewStudies();
	}
</script>

<h1>Repertoire</h1>
<div>

	{#await studies_promise then studies}
		<ul>
		{#each studies as study (study.id) }
			<li>{study.name} (<a href="https://lichess.org/study/{study.lichessId}">go to lichess</a>)</li>
		{/each}
		</ul>
	{/await}


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
