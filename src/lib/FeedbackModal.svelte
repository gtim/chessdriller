<script lang="ts">
	import { closeModal } from 'svelte-modals'
	import { fly } from 'svelte/transition'

	export let isOpen: boolean;
</script>

{#if isOpen}
	<!-- on:introstart and on:outroend are required to transition 1 at a time between modals -->
	<div role="dialog" class="modal" transition:fly={{ y: 50 }} on:introstart on:outroend>
		<div class="contents">
			<h2>Feedback</h2>
			<div>
				<p>Any feedback is greatly appreciated.</p>
				<textarea placeholder="feedback, question or bug report"></textarea>
			</div>
			<div>
				<p>Email address if you'd like a respose:</p>
				<input type="text" class="email" placeholder="email address">
			</div>
			<input type="submit" class="submit cdbutton" value="Send feedback">
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
		gap:8px;
		pointer-events: auto;
	}
	
	textarea {
		height:96px;
	}
	textarea, input.email {
		box-sizing: border-box;
		width:100%;
	}
	input.submit {
		align-self:center;
		width:fit-content;
		margin-top:8px;
		font-size:14px;
		padding:4px 8px;
	}

	h2 {
		text-align:center;
		margin:0;
	}
	p {
		margin:0 0 4px 0;
	}

</style>
