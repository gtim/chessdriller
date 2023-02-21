# chessdriller

## Build notes

1. `$ cp .env.example .env`
2. `$ npx prisma db push`
3. insert default user: `sqlite3 prisma/dev.db` and `INSERT INTO User DEFAULT VALUES;`

## Misc. notes

* Positions are canonicalised using FEN except the last three elements (en passant square, half-move clock and fullmove number). This could cause issues in variations with move repetitions, or in rare transpositions involving en passants.
* Uses [chess.js](https://github.com/jhlywa/chess.js) for chess logic, but also the fork [cm-chess](https://github.com/shaack/cm-chess) for PGN parsing since it supports recursive annotation variations (RAV).
