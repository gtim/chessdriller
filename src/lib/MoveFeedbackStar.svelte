<script>
	import { fade, fly } from 'svelte/transition';
	export let content = 'blao';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<div
	in:fade="{{ duration: 2000 }}"
	out:fade="{{ duration: 1000 }}"
	on:introend="{()=>dispatch('done')}"
>
	{content}
</div>

<style>
	div {
		width:32px;
		height:32px;
		background-color:cyan;
	}
</style>
