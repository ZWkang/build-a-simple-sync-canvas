# Backend Release

This archive contains a self-contained Bun server bundle and its Drizzle migrations.

```bash
cp .env.example .env
bun run dist/db/migrate.js
bun run dist/index.js
```

The server listens on `PORT` and stores SQLite data at `DATABASE_URL`. Both values are validated when each command starts.
