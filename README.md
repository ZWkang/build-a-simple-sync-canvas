# Sync Canvas

一个可以真实运行的多人协作节点画布示例。参与者通过共享 URL 同时创建、编辑、拖动和连接节点，并能看到彼此的鼠标位置、选中节点与拖动状态。

## Current capabilities

- Canvas 列表、创建、打开、重命名和确认删除。
- React Flow 节点图：节点标题、正文、颜色、位置和有向连接。
- Yjs 实时合并；每个 Canvas 对应一个 `Y.Doc`。
- Hocuspocus WebSocket 同步与 Awareness Presence。
- 协作者鼠标、选中节点、具名头像和尽力而为的拖动软占用。
- 当前协作者页面会话范围内的撤销与重做。
- SQLite 保存 Canvas 元数据和最新 Yjs 二进制状态。
- 断线后画布保持可见但只读，重连追平后恢复编辑。

这是无账号、无权限控制的本地示例：当前实例会列出所有 Canvas，得到链接的人都能编辑。第一版不支持离线编辑、字符级文本协同、用户版本历史、多选、复制粘贴或分组。

## Stack

- `apps/backend`：Hono、Hocuspocus、Bun SQLite、Drizzle ORM、Zod。
- `apps/frontend`：React 19、React Flow、Yjs、Hocuspocus Provider、TanStack Router/Query、Tailwind CSS 4、shadcn/ui。
- 根目录：Bun workspace、tsgo、Oxlint、Prettier。

前端参考 [TanStarter](https://github.com/mugnavo/tanstarter)，只保留浏览器端技术栈。TanStack Start、Nitro、服务端函数、认证、数据库和部署配置均未引入；这些能力由独立后端负责。

## Collaboration architecture

```text
React Flow interaction
        ↓ commands / snapshots
CanvasDocument (Y.Map nodes + connections, UndoManager)
        ↓ Yjs updates                    ↕ Awareness
Hocuspocus Provider ← WebSocket → Hocuspocus on Bun
                                      ↓ debounced binary state
                               SQLite canvas_documents
```

React Flow 只拥有渲染与指针交互，`CanvasDocument` 是前端领域命令缝隙；Hocuspocus 负责 Yjs wire protocol，应用自己拥有文档结构、生命周期和 SQLite 持久化。节点删除会在一个事务中删除相关连接；并发产生的孤立连接会被确定性清理。

领域词汇见 [CONTEXT.md](./CONTEXT.md)，架构取舍见 [docs/adr](./docs/adr)。

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

## Quick start

Prerequisite: [Bun](https://bun.sh/) 1.2.19 or newer.

```bash
bun install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
bun run --cwd apps/backend db:migrate
bun run dev
```

打开 `http://localhost:3000` 创建 Canvas，进入画布后设置当前浏览器的协作者身份。点击“复制协作链接”，再用另一个浏览器窗口打开同一 URL，即可验证节点、连接、选中状态和鼠标位置的实时同步。

开发地址：前端 `http://localhost:3000`，后端 `http://localhost:3001`。后端健康检查为 `GET /api/health`。

## Configuration

后端运行时变量：

| Variable       | Default                 | Purpose                |
| -------------- | ----------------------- | ---------------------- |
| `DATABASE_URL` | `./data/sync-canvas.db` | SQLite 数据库路径      |
| `PORT`         | `3001`                  | HTTP 与 WebSocket 端口 |

前端构建时变量：

| Variable                 | Default                    | Purpose            |
| ------------------------ | -------------------------- | ------------------ |
| `VITE_API_URL`           | `http://localhost:3001`    | HTTP API 基础地址  |
| `VITE_COLLABORATION_URL` | 由 `VITE_API_URL` 自动推导 | Yjs WebSocket 地址 |

部署到非本地地址时，在构建前设置例如：

```bash
VITE_API_URL=https://api.example.com
VITE_COLLABORATION_URL=wss://api.example.com/api/collaboration
```

## Commands

| Command                                 | Purpose                                   |
| --------------------------------------- | ----------------------------------------- |
| `bun run dev`                           | 同时启动前后端开发服务                    |
| `bun run dev:backend`                   | 仅启动后端                                |
| `bun run dev:frontend`                  | 仅启动前端                                |
| `bun run test`                          | 运行两个应用的 Bun 测试                   |
| `bun run build`                         | 构建两个应用                              |
| `bun run check`                         | 运行 lint、类型检查、测试、格式检查和构建 |
| `bun run release`                       | 校验仓库并生成前后端发布归档              |
| `bun run --cwd apps/backend db:migrate` | 应用 SQLite 迁移                          |

后端 HTTP API 和 WebSocket 约定见 [apps/backend/README.md](./apps/backend/README.md)，前端领域模型与环境变量说明见 [apps/frontend/README.md](./apps/frontend/README.md)。

## Release

`bun run release` 先执行完整仓库检查，再在 `release/` 下同时生成两个独立归档：

- `sync-canvas-backend-v<version>.tar.gz`：Bun 服务 bundle、迁移 runner、Drizzle migrations 和环境变量示例。
- `sync-canvas-frontend-v<version>.tar.gz`：纯静态前端构建产物。

`release/manifest.json` 记录版本、生成时间和两个归档的 SHA-256。发布过程不使用 Changesets，也不执行 npm publish。

## License

[MIT](./LICENSE) License © 2022 [zwkang](https://github.com/zwkang)
