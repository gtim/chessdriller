<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import gsap from 'gsap';
	export let x, y;
	export let value, unit;
	export let mirrored = false; // show stamp on the left side, if there's not enough space to the right (white h-file / black a-file)
	let w, h;

	$: content = '+' + value + '&thinsp;' + unit;


	const rotation = (mirrored?-1:1) * ( 10+Math.random()*50 ); // 10-60
	const dx = (mirrored?-1:1) * 25;
	const dy = -20;

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
	style="left:{x-w/2+dx}px;top:{y-h/2+dy}px;rotate:{rotation}deg;"
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
		background-color:rgba(250,240,230,0.9); /* #FAF0E6 (+alpha) */
		border-width:2px 0;
		border-color:rgba(164, 97, 91);
		border-style:solid;
		padding:0 2px;
		line-height:16px;
		z-index:100;
		pointer-events:none; /* allow click/touch through */
	}
</style>
