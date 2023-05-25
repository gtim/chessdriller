# To-do and other thoughts

## Bugs

* when studies are removed at Lichess, they remain on Chessdriller
* visual bug: en passant leaves the captured pawn
* PGNs must end in newlines
* occasionally at start of study, touching a square calls the touch event on the above square until refresh
* it's possible to get stuck in a "skip end of line" loop if a move before a line-split becomes due while studying

## Small features

* repertoire: auto-update studies on login 
* study: "skip to first due move" button
* study: "skip end of line" should play it through quickly instead of jumping
* set time zone per user (day currently wraps at 00:00 GMT)
* pgn upload: don't upload empty pgn if an error occurred
* pgn upload: guess repertoire color and display parse issues before submitting form


## Big features

* practice specific study/PGN/chapter (whether due or not)
    - should wrong-moves here always affect scheduling? or only if the move was due?
* repertoire: tree visualization of repertoire with all variations
    - color-coded for move maturity?
    - hover to show move or position?
* /repertoire/study/[studyId]
    - tree view for the specific study
    - split into study chapters?
* study: display PGN comments
        - should PGN upload overwrite previous move comments?
* study: display "variations due" (in addition to "moves due")
* profile page (/me?)
    - show lichess username
    - set time zone
    - "calendar" with a cross/checkmark every day the user studied (current month? current+past?)
    - current+best streak
* identify leeches (keep count of lapses?)
* keep track of user's lichess games and notify on out-of-repertoire moves
* monitor lichess API responses for 429s and [respond properly ](https://lichess.org/page/api-tips)


### Styling improvements

- make the move sheet double-column
* correct-move "stamp" on the a/h files makes the board zoom out slightly
* animation feedback on wrong move (board/piece shake? flash board reddish?)
* animation feedback on variation finished
* some prop background image on each page? book? pipe? coffe cup? glasses? chess pieces? chessboard? score sheet?
* special rewarding correct-move stamp at the max interval

## Misc. thoughts

* incorrect answer decreases move ease, but when to increase?
* line-scheduling issues
    - a short transposition / move-order swap will lead to the entire line being quized twice, with each variation.
    - possible solution: just quiz until the last due move, not to the end of the line 
    - counter-issue: when in learning, a line will "trickle in" to the due-queue, and if reviewed before it's finished trickling, stopping at the last due move would leave the rest for the due-queue in a couple minutes.
* moves "reviewed early" are simply pushed forward at the current interval. should be handled better, maybe increase the interval (proportionally?) if they're reviewed >50% through.
