# Build notes

## Node (normal build)

1. `cp .env.example .env` -- adjust this config to your environment.
2. `npm install`
3. `npx prisma db push`
4. `npm run build`
5. `node server.js`

For dev build, replace steps 4-5 with `npm run dev -- --host`.

## Docker Compose

1. `cp .env.example .env` -- adjust this config to your environment.
2. `docker compose up --build -d`

Whenever you change environment variables in `.env`, rebuild the container to have the changes take effect.
