<script>
	export let loggedIn = false;
</script>

<ul>
	<li><a href="/study">Study</a></li>
	<li><a href="/rep">Repertoire</a></li>
	<li><a href="/pgn">PGNs</a></li>
	{#if ! loggedIn}
		<li><a href="/join">Join or log in</a></li>
	{:else}
		<li><a href="/signout">Log out</a></li>
	{/if}
</ul>

<style>
	ul {
		margin:0;
		padding:0;
		display:flex;
		justify-content:center;
		list-style-type:none;
	}
	li {
		margin:0;
		padding:0px 8px;
	}
	li + li {
		border-color:rgba(40,43,40,0.3); /* #282B28 */
		border-style:solid;
		border-width:0 0 0 1px;
	}
</style>
