# monorepo-lib-template

A Bun-powered TypeScript monorepo template for library projects.

## Stack

- Bun for package management and workspace scripts.
- tsgo for TypeScript checking.
- oxlint for fast linting.
- Prettier for formatting.
- Changesets for versioning and publishing.

## Structure

```text
.
├── packages/          # Workspace packages go here
├── src/               # Minimal root TypeScript entry
├── .changeset/        # Changesets configuration
├── bun.lock           # Bun lockfile
└── tsconfig.base.json # Shared TypeScript baseline
```

## Commands

```bash
bun install
bun run check
bun run lint
bun run typecheck
bun run format
bun run changeset
```

## Creating A Package

Create package folders under `packages/`:

```text
packages/
└── my-package/
    ├── package.json
    └── src/
        └── index.ts
```

Each workspace package can define its own build and publish behavior while sharing the root toolchain.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=zwkang/monorepo-lib-template&type=Date)](https://star-history.com/#zwkang/monorepo-lib-template&Date)

## License

[MIT](./LICENSE) License © 2022 [zwkang](https://github.com/zwkang)
