# Build notes

1. `cp .env.example .env`
2. `npm install`
3. `npx prisma db push`
4. `npm run build`
5. `node server.js`

For dev build, replace steps 3-4 with `npm run dev -- --host`.

To host at another domain than [chessdriller.org](https://chessdriller.org/), 
change the Lichess callback domain name in `src/lib/server/lucia.js`.

