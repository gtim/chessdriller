<script lang="ts">
	import RelativeTime from '@yaireo/relative-time';
	const relativeTime = new RelativeTime();
	export let data;
</script>


<h1>View Feedback</h1>
<div class="narrow_container">
	<table>
		{#each data.feedbacks as feedback}
			<tr>
				<td>{feedback.content}</td>
				<td title="{feedback.submitted.toLocaleString()}">{relativeTime.from(feedback.submitted)}</td>
				<td>{feedback.user ? feedback.user.lichessUsername : ''}</td>
				<td>{feedback.email}</td>
				<td>{feedback.seen?'':'*'}</td>
			</tr>
		{/each}
	</table>
</div>

<style>
	.narrow_container {
		width:100%;
		max-width:512px;
		margin:0 auto;
	}
</style>
