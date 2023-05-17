<script>

	import LStudyCard from '$lib/LStudyCard.svelte';

	import { fade, slide } from 'svelte/transition';

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
</script>

<LStudyCard
	fen={previewFen}
	orientation={repForWhite?'white':'black'}
	title={name}
>
<p>{_count.moves} {repForWhite?'white':'black'} move{_count.moves==1?'':'s'}.</p>
<p>Updated <span title="{lastModifiedOnLichess}">{updated_ago}</span>.</p>
</LStudyCard>

<style>
	p {
		margin:0;
	}
</style>
