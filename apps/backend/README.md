# Sync Canvas Backend

Hono HTTP API and Hocuspocus Yjs WebSocket server running in one Bun process with SQLite, Drizzle ORM, and Zod.

```bash
cp .env.example .env
bun run db:migrate
bun run dev
```

Endpoints:

- `GET /api/health`
- `GET /api/canvases`
- `POST /api/canvases` with `{ "title": "Planning board" }`
- `GET /api/canvases/:canvasId`
- `PATCH /api/canvases/:canvasId` with `{ "title": "Architecture map" }`
- `DELETE /api/canvases/:canvasId`
- `WS /api/collaboration` using the Canvas ID as the Hocuspocus document name

`canvas_documents` stores one latest encoded Yjs state per Canvas. Deleting a Canvas first notifies and closes the active Hocuspocus document, then deletes metadata and cascades its stored state.

Each domain feature owns its route, validation, persistence schema, repository, and tests under `src/features/<feature>/`.
