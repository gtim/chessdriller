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

<div>
	<h1>Hi!</h1>
	<p><b>Chessdriller</b> is an open-source app for spaced repetition of chess openings. It's a free and libre alternative to the spaced-repetition features of Chessable, ChessTempo, Chessmadra, ChessHQ, Chess Position Trainer, Bookup and Listudy.</p>
	<p>Although I'm building Chessdriller for my own chess practice, it's fully functional. If you've been looking for something like this and would like to try it out, please <a href="mailto:tim@gurka.se">shoot me an email</a> to get an account.</p>
	<p>Cheers,<br/>
	Tim</p>
</div>

<style>
	div {
		width:512px;
		max-width:100%;
		margin:0 auto;
	}
</style>
