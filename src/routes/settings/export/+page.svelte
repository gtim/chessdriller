<h1>Export your data</h1>
<div class="narrow_container">

	<h2>Moves</h2>
	<p>All moves in your repertoire. Deleted moves, e.g. those only in studies that have been added and then removed, are not included. <a href="/settings/export/moves.csv">Download moves.csv</a>.</p>
	<table>
		<tr><th>Column</th><th>Description</th></tr>
		<tr><td>id</td><td>Unique ID, won't change.</td></tr>
		<tr><td>moveSan</td><td>The move, in short algebraic notation.</td></tr>
		<tr><td>fromFen</td><td>Position before the move, in <a href="https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation">FEN</a>.</td></tr>
		<tr><td>toFen</td><td>Position after the move, in <a href="https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation">FEN</a>.</td></tr>
		<tr><td>repForWhite</td><td>1 if this move belongs to the White repertoire, or 0 if it belongs to the Black repertoire.</td></tr>
		<tr><td>ownMove</td><td>1 if this move is played by the user, 0 if it is played by the opponent.</td></tr>
		<tr><td>learningDueTime</td><td>Time at which the move is due, if it's in the learning phase.</td></tr>
		<tr><td>learningStep</td><td></td></tr>
		<tr><td>reviewDueDate</td><td>Date at which the move is due, if it's in the review phase.</td></tr>
		<tr><td>reviewInterval</td><td>Length of current repetition spacing in days.</td></tr>
		<tr><td>reviewEase</td><td>How hard the move is. Decreases on wrong answer. Used as multiplier for the repetition spacing on correct answer.</td></tr>
	</table>

	<h2>Study History</h2>
	<p>History of all correct and incorrect answers when studying. <a href="/settings/export/history.csv">Download history.csv</a>.</p>
	<table>
		<tr><th>Column</th><th>Description</th></tr>
		<tr><td>moveId</td><td>ID of the move practiced, corresponds to the ID in moves.csv.</td></tr>
		<tr><td>studiedAt</td><td>The date and time at which you practiced the move.</td></tr>
		<tr><td>correct</td><td>1 if your answer was correct, 0 if not.</td></tr>
		<tr><td>incorrectGuessSan</td><td>The move that you guessed, in case it was not the correct answer.</td></tr>
	</table>
</div>

<style>
	.narrow_container {
		width:100%;
		max-width:512px;
		margin:0 auto;
	}
	table {
		margin:0 32px 32px 32px;
		border-collapse: collapse;
		border-spacing: 0;
		text-align:left;
		font-size:14px;
	}
	table th {
		border-width:0 0 1px 0;
		border-color:black;
		border-style:solid;
	}
	table tr:nth-child(2) td {
		padding-top:4px;
	}
	th {
		text-align:left;
	}
	tr td:first-child {
		font-family: monospace;
		vertical-align:top;
		padding-right:8px;
	}
	
</style>
