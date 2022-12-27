<script>
	export let data;
	function createTest() {
		alert(123);
	}
	/*
	export async function load({ fetch, params }) {
		const res = await fetch(`/api/${params.id}`);
		const item = await res.json();
		return { item };
	}
	*/
</script>

<h1>Welcome to SvelteKit</h1>
<a on:click={createTest}>{data.bla}</a>

