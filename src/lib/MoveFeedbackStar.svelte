<script>
	import { fade, fly } from 'svelte/transition';
	export let content = 'blao';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function floatAway(node) {
		return {
			duration: 3000,
			css: (t,u) => {
				let opacity = 1;
				if ( t < 0.1 ) {
					opacity = t/0.1;
				} else if ( t > 0.7 ) {
					opacity = (1-t)/0.3;
				}
				return `opacity: ${opacity}; transform: translateY(${-500*(t)}px)`	
			}
		};
	}
</script>

<div
	in:floatAway
	on:introend="{()=>dispatch('done')}"
>
	{content}
</div>

<style>
	div {
		width:32px;
		height:32px;
		background-color:cyan;
		z-index:100;
	}
</style>
