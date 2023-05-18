<script>

	import LStudyCard from '$lib/LStudyCard.svelte';

	import { fade, slide } from 'svelte/transition';

	import ConfirmModal from '$lib/ConfirmModal.svelte'
	import { openModal } from 'svelte-modals'

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	import RelativeTime from '@yaireo/relative-time';
	const relativeTime = new RelativeTime();


	export let id;
	export let name;
	export let repForWhite;
	export let previewFen;
	export let _count;
	export let lastModifiedOnLichess;

	
	let updated_ago = relativeTime.from( new Date(lastModifiedOnLichess) );
	let moves_string = _count.moves+' '+(repForWhite?'white':'black')+' move'+(_count.moves==1?'':'s'); // e.g. "8 black moves"

	function confirmRemoval(){
		openModal( ConfirmModal, {
			title: 'Remove study?',
			message: 'Remove the study <i>'+name+'</i> from your repertoire? Chessdriller remembers how well you knew the moves, in case you add them back later.',

			confirm: () => { alert('not implemented'); },
			confirmLabel: 'Remove'
		} );
	}

</script>

<LStudyCard
	fen={previewFen}
	orientation={repForWhite?'white':'black'}
	title={name}
>
	<p>{moves_string}</p>
	<p>Updated <span title="{lastModifiedOnLichess}">{updated_ago}</span>.</p>
	<button class="remove" title="Remove study from repertoire" on:click={confirmRemoval}>&#x2715;</button>
</LStudyCard>

<style>
	p {
		margin:0;
	}
	button.remove {
		position:absolute;
		top:3px;
		right:6px;
		padding:0;
		background:none;
		border:none;
		cursor:pointer;
		color:#800020;
	}
</style>
