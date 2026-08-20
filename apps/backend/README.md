# Backend

Hono API running on Bun with SQLite, Drizzle ORM, and Zod.

```bash
cp .env.example .env
bun run db:migrate
bun run dev
```

Endpoints:

- `GET /api/health`
- `GET /api/canvases`
- `POST /api/canvases` with `{ "title": "Planning board" }`

Each domain feature owns its route, validation, persistence schema, repository, and tests under `src/features/<feature>/`.
