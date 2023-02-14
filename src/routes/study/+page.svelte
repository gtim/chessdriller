<script>

	import StudyBoard from '$lib/StudyBoard.svelte';
	
	let line;
	async function studyLine() {
		const response = await fetch('/api/study?color=b');
		const json = await response.json();
		line = json.line;
		console.log(json);
	}

	function bla() {
	}

	
</script>

<h2>Study Black Repertoire</h2>

<button on:click={studyLine}>study line</button>
<button on:click={bla}>bla</button>

{#if line}
	<p>
	{#each line as move}
		{move.moveSan+' '} 
	{/each}
	</p>
{/if}

{#if line}
<StudyBoard {line}/>
{/if}
