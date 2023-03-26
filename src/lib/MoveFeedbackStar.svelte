<script>
	import { fade, fly } from 'svelte/transition';
	export let content;
	export let x;
	export let y;

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	console.log(x + ", "+y);

	function floatAway(node) {
		return {
			duration: 2000,
			css: (t,u) => {
				let opacity = 1;
				if ( t < 0.03 ) {
					opacity = t/0.03;
				} else if ( t > 0.7 ) {
					opacity = (1-t)/0.3;
				}
				return `opacity: ${opacity}; transform: translateY(${-300*(t)}px)`	
			}
		};
	}
</script>

<div
	style="left:{x-16}px;top:{y-16}px;"
	in:floatAway
	on:introend="{()=>dispatch('done')}"
>
	{content}
</div>

<style>
	div {
		position:absolute;
		top:200px;
		width:32px;
		height:32px;
		background-color:cyan;
		z-index:100;
	}
</style>
