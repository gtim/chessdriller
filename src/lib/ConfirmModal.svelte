<script>
	import { closeModal, openModal } from 'svelte-modals'
	import { fly } from 'svelte/transition'

	export let isOpen;
	export let title;
	export let message;
	export let confirm;
	export let confirmLabel = "OK";
</script>

{#if isOpen}
	<!-- on:introstart and on:outroend are required to transition 1 at a time between modals -->
	<div role="dialog" class="modal" transition:fly={{ y: 50 }} on:introstart on:outroend>
		<div class="contents">
			<h2>{title}</h2>
			<p>{@html message}</p>
			<div class="actions">
				<button on:click={closeModal}>Cancel</button>
				<button on:click={confirm}>{confirmLabel}</button>				
			</div>
		</div>
	</div>
{/if}

<style>
	.modal {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index:10;
		/* allow click-through to backdrop */
		pointer-events: none;
	}

	.contents {
		min-width: 240px;
		max-width: 512px;
		border-radius: 6px;
		padding: 16px;
		background-color: #FAF0E6;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: auto;
	}

	h2 {
		text-align:center;
	}
	h2, p {
		margin:8px;
	}

	.actions {
		margin-top: 24px;
		display: flex;
		justify-content: space-around;
		gap: 8px;
	}
	button {
		font-size:16px;
		padding:4px 8px;
		background:#FFF6ED;
		border:1px solid rgba(40,43,40,0.7);
		border-radius:4px;
		cursor:pointer;
	}
	button:hover {
		background:#F2E6DB;
	}

</style>
