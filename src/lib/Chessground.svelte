<script>
	import { Chessground } from 'chessground';
	import '../../node_modules/chessground/assets/chessground.base.css';
	import '../../node_modules/chessground/assets/chessground.brown.css';
	import '../../node_modules/chessground/assets/chessground.cburnett.css';
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

