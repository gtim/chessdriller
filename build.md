# Build notes

1. `$ cp .env.example .env`
2. `$ npx prisma db push`
3. insert default user: `sqlite3 prisma/dev.db` and `INSERT INTO User DEFAULT VALUES;`
