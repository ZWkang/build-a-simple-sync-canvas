# Sync Canvas

一个以 Bun 为统一运行时和包管理器的前后端 workspace。

## Stack

- `apps/backend`：Hono、Bun SQLite、Drizzle ORM、Zod。
- `apps/frontend`：React 19、Vite、TanStack Router、TanStack Query、Tailwind CSS 4、shadcn/ui。
- 根目录：Bun workspace、tsgo、Oxlint、Prettier。

前端参考 [TanStarter](https://github.com/mugnavo/tanstarter)，只保留浏览器端技术栈。TanStack Start、Nitro、服务端函数、认证、数据库和部署配置均未引入；这些能力由独立后端负责。

## Structure

```text
.
├── apps/
│   ├── backend/       # Hono API，feature-first
│   └── frontend/      # Vite SPA，feature-first
├── docs/agents/       # Agent workflow source of truth
├── AGENTS.md          # Repository-wide rules
├── bun.lock
└── tsconfig.base.json
```

## Commands

```bash
bun install
bun run dev
bun run dev:backend
bun run dev:frontend
bun run check
bun run test
bun run build
bun run release
```

首次运行后端前，应用数据库迁移：

```bash
bun --cwd apps/backend run db:migrate
```

开发地址：前端 `http://localhost:3000`，后端 `http://localhost:3001`。后端健康检查为 `GET /api/health`。

## Release

`bun run release` 先执行完整仓库检查，再在 `release/` 下同时生成两个独立归档：

- `sync-canvas-backend-v<version>.tar.gz`：Bun 服务 bundle、迁移 runner、Drizzle migrations 和环境变量示例。
- `sync-canvas-frontend-v<version>.tar.gz`：纯静态前端构建产物。

`release/manifest.json` 记录版本、生成时间和两个归档的 SHA-256。发布过程不使用 Changesets，也不执行 npm publish。

## License

[MIT](./LICENSE) License © 2022 [zwkang](https://github.com/zwkang)
