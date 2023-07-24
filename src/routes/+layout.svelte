<script>
	import '../app.css';
	import NavLinks from '$lib/NavLinks.svelte';
	import { Modals, closeModal } from 'svelte-modals'
	import { fade } from 'svelte/transition';

	import FeedbackModal from '$lib/FeedbackModal.svelte'
	import { openModal } from 'svelte-modals'

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
		<ul>
			<!--<li><a href="https://github.com/gtim/chessdriller" target="_blank" rel="noopener noreferrer">source code</a></li>-->
			<li>
				<!-- feedback SVG from Remixicon -->
				<button on:click={()=>openModal(FeedbackModal)}>
					Feedback
					<svg style="height:18px;vertical-align:middle;margin-bottom:2px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<path fill="#800020" d="M6.45455 19L2 22.5V4C2 3.44772 2.44772 3 3 3H21C21.5523 3 22 3.44772 22 4V18C22 18.5523 21.5523 19 21 19H6.45455ZM4 18.3851L5.76282 17H20V5H4V18.3851ZM11 13H13V15H11V13ZM11 7H13V12H11V7Z"></path>
					</svg>
				</button>
			</li>
		</ul>
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
		min-height: 100dvh;
		width:100%;
	}
	.header {
		margin-top:16px;
	}
	.content {
		margin:0 16px;
	}

	/* footer */

	.footer {
		margin:8px 0;
	}
	.footer ul {
		margin:0;
		padding:0;
		display:flex;
		justify-content:right;
		list-style-type:none;
	}
	.footer li {
		margin:0;
		padding:0px 8px;
		font-size:14px;
	}
	.footer li + li {
		border-color:rgba(40,43,40,0.3); /* #282B28 */
		border-style:solid;
		border-width:0 0 0 1px;
	}
	.footer button {
		background: none!important;
		border: none;
		padding: 0!important;
		color:#800020;
		text-decoration: none;
		cursor: pointer;
	}
	.footer button:hover {
		text-decoration: underline;
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
