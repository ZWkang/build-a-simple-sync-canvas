# Repository Guidelines

## Project Structure & Module Organization

This repository is currently an empty Git scaffold; no application, test, or asset directories have been committed yet. Keep the root limited to project-wide configuration and documentation. When implementation begins, use `src/` for product code, `tests/` for automated tests, and `public/` or `assets/` for static files. Group canvas features by responsibility—for example, `src/canvas/`, `src/sync/`, and `src/ui/`—and keep shared types close to the modules that own them.

## Build, Test, and Development Commands

No package manager, build system, or test runner is configured yet. Do not document or rely on guessed commands. When adding the initial toolchain, expose the standard workflows through one manifest (such as `package.json`) and update this guide in the same change. Prefer predictable commands such as:

- `npm run dev` — start the local development server.
- `npm test` — run the automated test suite.
- `npm run build` — create a production build.
- `npm run lint` — check formatting and static-analysis rules.

Until then, use `git status` and `git diff --check` to inspect changes and whitespace errors.

## Coding Style & Naming Conventions

Follow the formatter and linter introduced by the chosen toolchain; commit their configuration rather than relying on editor-only settings. Use two-space indentation for JavaScript, TypeScript, JSON, and CSS. Prefer `PascalCase` for components and classes, `camelCase` for functions and variables, and `kebab-case` for asset filenames. Keep synchronization logic deterministic and separate from rendering or pointer-event code.

## Testing Guidelines

Add tests with every behavior change once a runner is configured. Name tests after observable behavior, using `*.test.ts` or the equivalent convention selected by the test framework. Prioritize sync conflict resolution, serialization, reconnect behavior, and canvas interaction boundaries. Bug fixes should include a regression test that fails before the fix.

## Commit & Pull Request Guidelines

There is no commit history from which to infer an established convention. Use short, imperative commit subjects, optionally with a Conventional Commit prefix (for example, `feat: add stroke synchronization`). Keep commits focused. Pull requests should explain the user-visible change, list verification performed, link relevant issues, and include screenshots or recordings for canvas or UI changes.

## Agent skills

### Issue tracker

Issues and specs are tracked as local Markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

This repository uses a single-context domain-doc layout. See `docs/agents/domain.md`.

### Frontend workflow

React and user-facing UI work must follow the skill routing and review gates in `docs/agents/frontend-workflow.md`.
