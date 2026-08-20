# Repository Guidelines

## Repository Shape

This is a Bun application workspace, not a publishable library monorepo.

- `apps/backend/` owns the Hono API and SQLite persistence.
- `apps/frontend/` owns the browser-only React application.
- Each app has a child `AGENTS.md`; read it before changing that app.
- Keep the root limited to workspace-wide configuration, documentation, and shared tooling.

Use feature-first organization inside both applications. Business behavior belongs under `src/features/<feature>/`; framework entrypoints and composition roots must stay thin. Keep synchronization logic deterministic and separate from rendering or pointer-event code.

## Commands

Use Bun for package management, scripts, tests, and the backend runtime.

- `bun run dev` — start both applications.
- `bun run dev:backend` — start the Hono API on port 3001.
- `bun run dev:frontend` — start the Vite frontend on port 3000.
- `bun run test` — run workspace tests with Bun.
- `bun run build` — build both applications.
- `bun run check` — run lint, typecheck, tests, formatting checks, and builds.
- `bun run release` — verify the repository and create separate frontend/backend release archives plus a checksum manifest.
- `bun --cwd apps/backend run db:generate` — generate a Drizzle migration.
- `bun --cwd apps/backend run db:migrate` — apply migrations to local SQLite.

Do not add npm, pnpm, or yarn lockfiles. Do not restore Changesets, npm package publishing, frontend server functions, or deployment-provider configuration unless the user explicitly changes the repository boundary. Release packaging is owned by `scripts/release.ts`; child apps must remain independently packageable.

## Coding Style

Follow the committed formatter and linter configuration. Use two-space indentation for JavaScript, TypeScript, JSON, and CSS. Prefer `PascalCase` for components and classes, `camelCase` for functions and variables, and `kebab-case` for assets. Do not hide failures behind mocks, swallowed exceptions, or silent fallbacks.

## Testing

Add tests with every behavior change. Name tests after observable behavior with `*.test.ts` or `*.test.tsx`. Backend integration tests must use a real temporary or in-memory SQLite database and real Hono requests. Prioritize sync conflict resolution, serialization, reconnect behavior, and canvas interaction boundaries as those features arrive.

## Documentation and Agent Workflows

- Issues and specs are local Markdown under `.scratch/`; see `docs/agents/issue-tracker.md`.
- Domain vocabulary and ADR rules are in `docs/agents/domain.md`.
- React and user-facing UI changes must follow every applicable route and review gate in `docs/agents/frontend-workflow.md`.
- Update this guide and the affected child `AGENTS.md` when tooling or architectural boundaries change.

## Commits and Pull Requests

Use short, imperative commit subjects, optionally with a Conventional Commit prefix. Keep commits focused. Pull requests should explain the user-visible change, list verification performed, link relevant issues, and include screenshots or recordings for canvas or UI changes.
