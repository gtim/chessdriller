<script lang="ts">
	export let data;
</script>

<div>
	<h1>Join Chessdriller</h1>
	<p>
		Chessdriller helps you memorize chess opening moves from your Lichess studies.
		By signing up with Lichess, you give Chessdriller access to your username and private studies, but nothing else.
		You can choose later which studies (if any) you want to practice.
	</p>
	<p><a href="{data.authUrl}">Click to sign up or log in with Lichess</a>.</p>
</div>

<style>
	div {
		width:100%;
		max-width:512px;
		margin:0 auto;
	}
</style>
