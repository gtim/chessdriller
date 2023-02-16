## Random future thoughts

* delay opponent moves slightly
* animation feedback on: correct/wrong move, variation done, entire variation correct
* keep W/B rep on the same study page, just distinguish them through board orientation. also force going through one color first, before switching to the other.
* pretend that there's no due moves if number of moves is <10 and another one will be due in a couple minutes
* identify leeches (keep count of lapses?)
* incorrect answer decreases move ease, but when to increase?
* undo button for pgn upload
* fuzzing: fuzz +/- 1 day (or +/-x%) per line, not per move, or the entire line will be scheduled at the line-minimum anyway
* line-scheduling issues
    - a short transposition / move-order swap will lead to the entire line being quized twice, with each variation.
    - possible solution: just quiz until the last due move, not to the end of the line 
    - counter-issue: when in learning, a line will "trickle in" to the due-queue, and if reviewed before it's finished trickling, stopping at the last due move would leave the rest for the due-queue in a couple minutes.
* connect to lichess account for auto-updating rep when study changes
