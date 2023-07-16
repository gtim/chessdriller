<script>
	import '../app.css';
	import NavLinks from '$lib/NavLinks.svelte';
	import { Modals, closeModal } from 'svelte-modals'
	import { fade } from 'svelte/transition';

	export let data;
	$: loggedIn = !!data.user;
</script>

<div class="grid-container">

	<div class="header">
		<NavLinks {loggedIn} />
	</div>

	<div class="content">
		<slot />
	</div>

	<div class="footer">
	</div>

</div>

<Modals>
	<div slot="backdrop" class="backdrop" transition:fade on:click={closeModal} on:keydown={closeModal} />
</Modals>


<style>
	.grid-container {
		display: grid;
		grid-template-rows: auto 1fr auto;
		grid-template-columns: 1fr;
		min-height: 100vh;
		width:100%;
	}
	.header {
		margin-top:16px;
	}
	.content {
		margin:0 16px;
	}
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
