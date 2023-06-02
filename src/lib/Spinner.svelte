<script>
	import {Spinner} from 'spin.js';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let delay = 1000; // ms delay before starting
	let show_spinner = false;

	onMount( () => {
		setTimeout(
			()=>{ show_spinner = true },
			delay
		);
	} );
</script>

<div class="spinner_container">
	{#if show_spinner}
		<div in:fade={{duration:1000}} out:fade={{duration:200}}></div>
	{/if}
</div>

<style>

.spinner_container {
	position:relative;
	width: 20px;
	height: 20px;
}

@keyframes spinner {
	to {transform: rotate(360deg);}
}
 
.spinner_container > div:before {
	content: '';
	box-sizing: border-box;
	position: absolute;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	border-top: 2px solid #800020;
	border-right: 2px solid transparent;
	animation: spinner 1s linear infinite;
}
</style>
