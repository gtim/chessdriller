<script>
	import '../app.css';
	import NavLinks from '$lib/NavLinks.svelte';
	import { Modals, closeModal } from 'svelte-modals'
	import { fade } from 'svelte/transition';
</script>

<NavLinks />

<slot />

<Modals>
  <div slot="backdrop" class="backdrop" transition:fade on:click={closeModal} />
</Modals>

<style>
	/* Backdrop for modals */
	.backdrop {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		background: rgba(0,0,0,0.50);
		z-index:10;
	}
</style>
