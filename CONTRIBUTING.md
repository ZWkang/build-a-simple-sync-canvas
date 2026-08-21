# Contributing

感谢你为 Sync Canvas 做贡献。这是一个由 Bun 管理的前后端应用工作区：`apps/backend` 负责 Hono API、Hocuspocus 与 SQLite 持久化，`apps/frontend` 负责浏览器端 React 应用。

## Development setup

需要 [Bun](https://bun.sh/) 1.2.19 或更高版本。

```bash
bun install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
bun run --cwd apps/backend db:migrate
bun run dev
```

前端默认运行在 `http://localhost:3000`，后端默认运行在 `http://localhost:3001`。更多配置和可用命令见 [README.md](./README.md)。

## Before changing code

1. 先确定改动属于前端、后端，还是根目录的共享工具。业务行为应放在对应应用的 `src/features/<feature>/` 中，框架入口与组合根保持轻量。
2. 阅读根目录 [AGENTS.md](./AGENTS.md) 以及所属应用的 `AGENTS.md`：[backend](./apps/backend/AGENTS.md) 或 [frontend](./apps/frontend/AGENTS.md)。
3. 阅读 [CONTEXT.md](./CONTEXT.md) 并检查 [docs/adr](./docs/adr) 中与改动相关的决策。代码、测试和文档使用已定义的领域词汇。
4. 非平凡改动使用本地 Markdown 记录规格与实现任务：`.scratch/<feature-slug>/spec.md` 和 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`。详细约定见 [docs/agents/issue-tracker.md](./docs/agents/issue-tracker.md)。

如果实现与已有 ADR 冲突，请先明确指出冲突并更新决策记录，不要让代码与文档静默分叉。

## Implementation rules

- 使用 Bun 安装依赖和运行脚本；不要添加 npm、pnpm 或 Yarn 锁文件。
- 保持同步内核可确定，并与 React 渲染、React Flow 投影及指针事件代码分离。
- 不要用 mock 成功、吞掉异常或静默 fallback 掩盖失败；错误应该在日志、响应或测试中清晰暴露。
- 每个行为变更都要增加或更新 `*.test.ts` / `*.test.tsx` 测试，测试名称描述可观察行为。
- 只在真正跨应用的配置、文档或工具发生变化时修改根目录。前后端必须保持可独立打包。

### Backend changes

- 请求参数、请求体、环境变量和公开响应在边界使用 Zod 校验。
- 持久化测试使用真实的临时或内存 SQLite 数据库和真实 Hono 请求，并关闭所有数据库连接。
- 修改 Drizzle schema 后生成并提交迁移，然后在本地应用它：

```bash
bun run --cwd apps/backend db:generate
bun run --cwd apps/backend db:migrate
```

### Frontend changes

- 路由文件只负责挂载 feature 入口；组件、hooks、queries、schemas 和测试保持在所属 feature 中。
- 优先复用已有 shadcn 原语和语义化颜色 token，不要在业务组件中复制基础 UI 或硬编码颜色。
- React 或用户可见界面变更必须按 [docs/agents/frontend-workflow.md](./docs/agents/frontend-workflow.md) 运行所有匹配的实现、review 与浏览器验证门禁。

## Verification

开发时先在改动所属应用内运行快速检查：

```bash
bun run --cwd apps/backend test
bun run --cwd apps/backend typecheck
bun run --cwd apps/backend build

bun run --cwd apps/frontend test
bun run --cwd apps/frontend typecheck
bun run --cwd apps/frontend build
```

提交 Pull Request 前在根目录运行完整检查：

```bash
bun run check
```

`bun run check` 依次运行 lint、类型检查、测试、格式检查和两个应用的构建。用户可见流程发生变化时，还必须在真实浏览器中走通受影响的路径。同步行为发生变化时，至少用两个浏览器会话验证合并、Presence、断线与重连边界。

## Commits and pull requests

- 保持提交聚焦，使用简短的祈使句主题，可选择 Conventional Commit 前缀，例如 `fix(frontend): preserve canvas during reconnect`。
- Pull Request 说明应包含用户可见变化、关联的本地 Issue/Spec、实际运行的验证命令与结果。
- Canvas 交互或 UI 变更附上截图或录屏；实时同步变更说明所使用的多会话验证路径。
- 不要夹带无关重构、生成产物、本地 `.env` 或 SQLite 数据库。

## Releases

发布版本由根目录 `package.json` 管理。确认工作树仅包含预期变更后运行：

```bash
bun run release
```

该命令会先执行完整仓库检查，再由 `scripts/release.ts` 生成独立的前端、后端归档和校验和清单。项目不使用 Changesets，也不执行 npm publish。
