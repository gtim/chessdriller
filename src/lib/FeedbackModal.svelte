<script lang="ts">
	import { closeModal } from 'svelte-modals'
	import { fly } from 'svelte/transition'

	export let isOpen: boolean;

	enum State {
		Input = 1,
		Loading,
		Success,
		Failure,
	}
	let state: State = State.Input;

	function submitFeedback() {
		state = State.Loading;
		fetch('/api/feedback', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content, email }),
		}).then( response => response.json() )
		.then( data => {
			if ( data.success ) {
				state = State.Success;
				return true;
			} else {
				state = State.Failure;
				return false;
			}
		} );
		return false;
	}

	let content = '';
	let email = '';
	
</script>

{#if isOpen}
	<div role="dialog" class="modal" in:fly={{ x: 20, y: 50 }} on:introstart on:outroend>
		<form method="POST" on:submit|preventDefault={submitFeedback}>
			<div class="contents">
				<h2>Feedback</h2>
				{#if state === State.Input || state === State.Loading }
					<div>
						<p>Any feedback is greatly appreciated.</p>
						<textarea placeholder="your feedback, question or bug report" bind:value={content}></textarea>
					</div>
					<div>
						<p>Email address if you'd like a respose:</p>
						<input type="text" class="email" placeholder="email address" bind:value={email}>
					</div>
					<input type="submit" class="submit cdbutton" value="Send feedback" disabled={content.length==0}>
				{:else if state === State.Success}
					<div><p>Thank you!</p></div>
					{#if email.length > 0}
						<div><p>I'll get back to you as soon as I can.</p></div>
					{/if}
					<button type="button" class="submit cdbutton" on:click={closeModal}>Close</button>
				{/if}
			</div>
		</form>
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
		font-size:14px;
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
		padding:4px;
	}
	textarea, input.email {
		box-sizing: border-box;
		width:100%;
	}
	input.submit, button.submit {
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
