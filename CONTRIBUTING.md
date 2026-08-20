## Contributing

Install dependencies with Bun:

```bash
bun install
```

Run the repository checks before opening a pull request:

```bash
bun run check
```

Keep changes inside the owning application and follow its `AGENTS.md`. Backend features live under `apps/backend/src/features/`; frontend features live under `apps/frontend/src/features/`.

Create both deployable archives with `bun run release`. Version the release from the root `package.json`; do not add Changesets files.
