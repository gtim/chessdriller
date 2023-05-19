<script>
	export const prerender = true;

	import { page } from '$app/stores';

	console.log($page.status + ' error at ' + $page.url.href);
</script>

<div class="narrow_container">
	<h1>Error: {$page.status} {$page.error.message}</h1>
</div>

<style>
	.narrow_container {
		width:512px;
		max-width:100%;
		margin:0 auto;
	}
</style>
