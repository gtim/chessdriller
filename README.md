# chessdriller

## Build notes

1. create `.env` (not in repo)
2. create prisma db: `npx prisma db push`
3. insert default user: `sqlite3 prisma/dev.db` and `INSERT INTO User DEFAULT VALUES;`

## Misc. notes

Positions are canonicalised using FEN except the last three elements (en passant square, half-move clock and fullmove number). This could cause issues in variations with move repetitions, or in rare transpositions involving en passants.
