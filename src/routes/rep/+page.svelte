<script>
	let studies_promise = getStudies();
	async function getStudies() {
		const res = await fetch( '/api/lichess-study' );
		const json = await res.json();
		return json.studies;
	}
</script>

<h1>Repertoire</h1>
<div>
	{#await studies_promise}
	{:then studies}
		<ul>
		{#each studies as study (study.id) }
			<li>{study.name} (<a href="https://lichess.org/study/{study.lichessId}">go to lichess</a>)</li>
		{/each}
		</ul>
	{/await}
</div>
