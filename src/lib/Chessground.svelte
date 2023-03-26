<script>
	import { Chessground } from 'chessground';
	import './chessground.base.css';
	import './chessground.brown.css';
	import './chessground-pieces.css';
	import { onMount } from 'svelte';

	export let config = {};
	export let chessground;

	let div;

	onMount(async () => {
		chessground = Chessground( div, config );
	});

</script>

<div bind:this={div} style="width:100%;height:100%;">
</div>

