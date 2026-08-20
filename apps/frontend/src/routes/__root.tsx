import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';

import type { RouterContext } from '@/app/router.tsx';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

function RootLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:ring-3 focus:ring-ring/40"
      >
        跳到主要内容
      </a>
      <Outlet />
    </>
  );
}

function NotFoundPage() {
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center px-6" tabIndex={-1}>
      <div className="flex max-w-md flex-col items-start gap-4">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">页面不存在</h1>
        <p className="text-muted-foreground">当前地址没有对应的前端路由。</p>
        <Link
          to="/"
          className="touch-manipulation rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
