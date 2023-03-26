## Random future thoughts

* animation feedback on
    - correct move: little star? 
        - different-sized feedback depending on whether move was due or not (e.g. big star, small star)
        - (or simply no feedback if move was not due)
    - wrong move: board/piece shake, flash background red?
    - variation done, entire variation correct
    - turning the board: actually turn the board?
* pretend that there's no due moves if number of moves is <10 and another one will be due in a couple minutes
* identify leeches (keep count of lapses?)
* incorrect answer decreases move ease, but when to increase?
* undo button for pgn upload
* line-scheduling issues
    - a short transposition / move-order swap will lead to the entire line being quized twice, with each variation.
    - possible solution: just quiz until the last due move, not to the end of the line 
    - counter-issue: when in learning, a line will "trickle in" to the due-queue, and if reviewed before it's finished trickling, stopping at the last due move would leave the rest for the due-queue in a couple minutes.
* connect to lichess account for auto-updating rep when study changes
* auto-detect if a PGN is for white or black based on number of alternative moves for either
    - warn if it seems the PGN was added to the wrong side
    - just have a single "upload PGN to rep" and let the user confirm auto-detected side
* "skip end of line" button if no other moves are due or in learning (done)
    - also "skip to first due move" button
    - maybe "always skip" checkbox
    - make "skip end of line" play it through quickly
* moves "reviewed early" are simply pushed forward at the current interval. should be handled better, maybe increase the interval (proportionally?) if they're reviewed >50% through.
