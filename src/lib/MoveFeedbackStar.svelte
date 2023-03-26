<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import gsap from 'gsap';
	export let x, y;
	export let value, unit;
	let w, h;

	$: content = '+' + value + '&thinsp;' + unit;


	const rotation = 10+Math.random()*50; // 10-60

	const dispatch = createEventDispatcher();

	let stamp;

	onMount( () => {
		let tl = gsap.timeline({onComplete: ()=>dispatch('done')});
		tl.fromTo( stamp,
			{
				scale:0,
				rotation: rotation - 90 + 180*Math.random(),
				x:-25, y:20,
			},
			{
				scale:1.3,
				rotation: rotation,
				x:0, y:0,
				duration:0.2,
				ease: "power1.out"
			},
		 );
		tl.to( stamp, { scale:1, duration: 0.1, ease: "power1.inOut" } );
		tl.to( stamp, {opacity:0, duration:2, delay: 0.5, ease: "power2.in"} );
	} );
</script>

<div
	style="left:{x-w/2+25}px;top:{y-h/2-20}px;rotate:{rotation}deg;"
	bind:clientWidth={w} bind:clientHeight={h}
	bind:this={stamp}
>
	{@html content}
</div>

<style>
	div {
		position:absolute;
		white-space:nowrap;
		font-weight:bold;
		font-size:18px;
		color:rgba(164, 97, 91);
		background-color:rgba(255,235,205,0.9);
		border-width:2px 0;
		border-color:rgba(164, 97, 91);
		border-style:solid;
		padding:0 2px;
		line-height:16px;
		z-index:100;
	}
</style>
