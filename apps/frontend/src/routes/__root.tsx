import { createRootRouteWithContext, Link, Outlet, type ErrorComponentProps } from '@tanstack/react-router';

import type { RouterContext } from '@/app/router.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: RouteError,
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
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    </>
  );
}

function RouteError({ error }: ErrorComponentProps) {
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center p-6" tabIndex={-1}>
      <Alert variant="destructive" className="max-w-lg">
        <AlertTitle>页面发生错误</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-4">
          <span>{error.message}</span>
          <div className="flex gap-2">
            <Button type="button" onClick={() => window.location.reload()}>
              重新加载
            </Button>
            <a className={buttonVariants({ variant: 'outline' })} href="/">
              返回首页
            </a>
          </div>
        </AlertDescription>
      </Alert>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center px-6" tabIndex={-1}>
      <div className="flex max-w-md flex-col items-start gap-4">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">页面不存在</h1>
        <p className="text-muted-foreground">当前地址没有对应的前端路由。</p>
        <Link to="/" className="text-sm font-medium underline underline-offset-4">
          返回首页
        </Link>
      </div>
    </main>
  );
}
