# Build notes

1. `cp .env.example .env`
2. `npx prisma db push`
3. `npm run build`
4. `node server.js`

For dev build, replace steps 3-4 with `npm run dev -- --host`.

To host at another domain than [chessdriller.org](https://chessdriller.org/), 
change the Lichess callback domain name in `src/lib/server/lucia.js`.

