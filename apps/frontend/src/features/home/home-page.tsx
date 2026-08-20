const stack = [
  {
    name: 'React 19',
    detail: '浏览器端组件与渲染',
  },
  {
    name: 'TanStack Router + Query',
    detail: '类型安全路由与服务端状态',
  },
  {
    name: 'Tailwind CSS + shadcn/ui',
    detail: '可组合的样式与组件基础',
  },
];

export function HomePage() {
  return (
    <main
      id="main-content"
      className="min-h-dvh bg-background px-6 py-16 text-foreground sm:px-10 lg:px-16"
      tabIndex={-1}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-14">
        <header className="flex max-w-3xl flex-col gap-5">
          <p className="text-sm font-medium tracking-wide text-muted-foreground" translate="no">
            SYNC CANVAS
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">前端工作区已就绪</h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            这是从 TanStarter 提取出的纯前端基础，只保留 React、TanStack 与 UI
            工具链；API、数据库和运行时职责位于独立后端。
          </p>
        </header>

        <section aria-labelledby="stack-heading" className="flex flex-col gap-5">
          <h2 id="stack-heading" className="text-lg font-medium">
            Frontend stack
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {stack.map((item) => (
              <li
                key={item.name}
                className="flex min-h-36 flex-col justify-between rounded-2xl border bg-card p-5 text-card-foreground"
              >
                <h3 className="font-medium" translate="no">
                  {item.name}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
