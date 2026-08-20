# Frontend Agent Guide

This file extends the repository-level `AGENTS.md` for `apps/frontend/`.

## Boundary

This application is a browser-only Vite SPA inspired by TanStarter. Keep React, TanStack Router, TanStack Query, Tailwind CSS, and shadcn/ui. Do not introduce TanStack Start, server functions, server routes, Nitro, Better Auth, Drizzle, database drivers, Docker, or deployment-provider configuration here. Backend communication must use an explicit HTTP client boundary.

## Organization

- Put user-facing behavior under `src/features/<feature>/`.
- Keep `src/routes/` as thin TanStack Router adapters that render feature entrypoints.
- Keep application composition in `src/app/` and reusable shadcn primitives in `src/components/ui/`.
- Keep a feature's components, hooks, queries, schemas, and tests together until a genuinely shared abstraction emerges.
- Import concrete modules directly; do not add broad barrel files.

## UI Workflow

Before changing React or user-facing UI, read `../../docs/agents/frontend-workflow.md` and run every applicable skill route and review gate. This is a configured shadcn project; inspect it with `bunx --bun shadcn@latest info` and use the CLI for registry components. Use semantic tokens instead of hard-coded component colors.

## Verification

- `bun run test`
- `bun run typecheck`
- `bun run build`
- Exercise affected runnable flows with the repository's browser workflow after static checks.

Do not add SSR-only tests or deployment smoke tests. Browser behavior tests should assert observable output and accessibility, while pure helpers remain Bun unit tests.
