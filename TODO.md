# To-do and other thoughts

This page lists planned and dreamed features along with other notes and thoughts, in no particular order.
Known bugs can be found on the [Github issue tracker](https://github.com/gtim/chessdriller/issues).

## Minor features

* handle studies that don't start at the initial position
* repertoire: auto-update studies on login
* repertoire: regenerate preview board on update
* study: "skip to first due move" button
* study: "skip end of line" should play it through quickly instead of jumping
* set time zone per user (day currently wraps at 00:00 GMT)
* pgn upload: guess repertoire color and display parse issues before submitting form
* feedback button to conveniently send me feedback on chessdriller


## Major features

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

* make the move sheet double-column
* animation feedback on wrong move (board/piece shake? flash board reddish?)
* animation feedback on variation finished
* some prop background image on each page? book? pipe? coffe cup? glasses? chess pieces? chessboard? score sheet?
* special rewarding correct-move stamp at the max interval

## Misc. thoughts

* incorrect answer decreases move ease, but when to increase?
* line-scheduling issues
    - a short transposition / move-order swap will lead to the entire line being tested twice, with each variation.
    - possible solution: just quiz until the last due move, not to the end of the line 
    - counter-issue: when in learning, a line will "trickle in" to the due-queue, and if reviewed before it's finished trickling, stopping at the last due move would leave the rest for the due-queue in a couple minutes.
* moves "reviewed early" are simply pushed forward at the current interval. should be handled better, maybe increase the interval (proportionally?) if they're reviewed >50% through.
