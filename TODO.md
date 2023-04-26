# To-do and other thoughts

## by view

* /repertoire view (not started)
    - list account's lichess studies 
        - "hide from list" button 
        - included / not included
        - last updated? 
        - "check for updates" button
        - study name
    - practice specific study/PGN/chapter (whether due or not)
        - should errors here always affect scheduling? or only if the move was due?
    - tree view of repertoire with all variations
        - color-coded for move maturity?
        - hover to show move or position?
    - /repertoire/study/[study-name]
        - above tree view for the specific study
        - split into study chapters?
* /pgn view
    - this should probably be a second-class page, since the main repertoire-building tool should be links to lichess studies
    - maybe under /repertoire/pgn? 
    - undo button for pgn upload
    - just a single drag-and-drop area: auto-detect if a PGN is for white or black based on number of alternative moves for either
        * user can pick white/black after uploading, but the guess is pre-picked.
        * warn if it seems the PGN was added to the wrong side
* /study view
    - make the move sheet look good again
    - display PGN comments
        - should PGN upload overwrite previous move comments?
    - "skip end of line" button if no other moves are due or in learning (done)
        - also "skip to first due move" button
        - maybe "always skip" checkbox
        - make "skip end of line" play it through quickly instead of jumping
    - "variations due" (in addition to "moves due")
    - visual bug: en passant leaves the captured pawn
    - correct-move "stamp" on the a/h files makes the board zoom out slightly
    - actually rotate the board when moving between white and black reportoires?
* /me view 
    - lichess username
    - settings
        * time zone
    - button to unhide all hidden studies
    - "calendar" with a cross/checkmark every day the user studied (current month? current+past?)
    - current streak?

## misc.

* some prop background image on each page 
    - book? pipe? coffe cup? glasses? chess pieces? chessboard? score sheet?
* animation feedback 
    - wrong move: board/piece shake, flash background red?
    - variation done
* identify leeches (keep count of lapses?)
* incorrect answer decreases move ease, but when to increase?
* line-scheduling issues
    - a short transposition / move-order swap will lead to the entire line being quized twice, with each variation.
    - possible solution: just quiz until the last due move, not to the end of the line 
    - counter-issue: when in learning, a line will "trickle in" to the due-queue, and if reviewed before it's finished trickling, stopping at the last due move would leave the rest for the due-queue in a couple minutes.
* moves "reviewed early" are simply pushed forward at the current interval. should be handled better, maybe increase the interval (proportionally?) if they're reviewed >50% through.
* keep track of user's lichess games and notify on out-of-repertoire moves
