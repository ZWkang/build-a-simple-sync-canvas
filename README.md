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
bun run --cwd apps/backend db:migrate
```

开发地址：前端 `http://localhost:3000`，后端 `http://localhost:3001`。后端健康检查为 `GET /api/health`。

前端默认连接上述本地后端。部署到其他地址时在构建前设置：

```bash
VITE_API_URL=https://api.example.com
VITE_COLLABORATION_URL=wss://api.example.com/api/collaboration
```

## Release

`bun run release` 先执行完整仓库检查，再在 `release/` 下同时生成两个独立归档：

- `sync-canvas-backend-v<version>.tar.gz`：Bun 服务 bundle、迁移 runner、Drizzle migrations 和环境变量示例。
- `sync-canvas-frontend-v<version>.tar.gz`：纯静态前端构建产物。

`release/manifest.json` 记录版本、生成时间和两个归档的 SHA-256。发布过程不使用 Changesets，也不执行 npm publish。

## License

[MIT](./LICENSE) License © 2022 [zwkang](https://github.com/zwkang)
