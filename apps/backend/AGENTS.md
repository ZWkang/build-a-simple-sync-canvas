# Backend Agent Guide

This file extends the repository-level `AGENTS.md` for `apps/backend/`.

## Architecture

- The runtime is Bun and the HTTP framework is Hono.
- SQLite is accessed through Drizzle ORM's `bun:sqlite` adapter.
- Zod owns runtime validation for environment variables, request bodies, and public response contracts.
- Organize behavior under `src/features/<feature>/`. A feature owns its routes, Zod contracts, Drizzle tables, repository, and tests.
- `src/app.ts` is only the HTTP composition root. `src/db/` owns connection setup, not feature queries.
- Keep cross-feature imports explicit. Do not introduce a generic service, repository, schema, or utility bucket to bypass ownership.

## Database Changes

Drizzle tables remain inside the owning feature's `schema.ts`. After changing a table, run `bun run db:generate` and commit the generated migration. Apply migrations with `bun run db:migrate`; do not auto-create tables or silently fall back to an in-memory database in application code.

## Validation and Errors

Validate inputs at the Hono route boundary and pass parsed values inward. Let unexpected database and programming failures surface; do not return mock success responses, swallow exceptions, or add fallback storage.

## Verification

- `bun run test`
- `bun run typecheck`
- `bun run build`

Tests that exercise persistence must use real SQLite and real Hono requests. Keep test databases isolated and close every connection.
