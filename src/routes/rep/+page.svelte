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
		if ( json.success && json.num_new_studies > 0 ) {
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


	<p><button on:click={lookForNewStudies}>Check for new studies</button></p>
	{#if new_studies_promise}
		{#await new_studies_promise}
			<p>...</p>
		{:then new_studies}
			<p>found {new_studies.num_new_studies} new {new_studies.num_new_studies==1?'study':'studies'}.</p>
		{/await}
	{:else}
		bla
	{/if}
</div>
