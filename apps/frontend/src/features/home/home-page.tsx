import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircleIcon, ArrowUpRightIcon, NetworkIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { createCanvas, deleteCanvas, listCanvases, renameCanvas, type CanvasRecord } from '@/features/canvases/api.ts';
import { cn } from '@/lib/utils.ts';

import { CanvasFormDialog } from './canvas-form-dialog.tsx';

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface HomeViewProps {
  canvases: CanvasRecord[];
  error?: string;
  loading: boolean;
  onCreate(title: string): Promise<void>;
  onDelete(canvasId: string): Promise<void>;
  onRename(canvasId: string, title: string): Promise<void>;
}

export function HomeView({ canvases, error, loading, onCreate, onDelete, onRename }: HomeViewProps) {
  return (
    <main id="main-content" className="min-h-dvh bg-muted/30 px-5 py-8 text-foreground sm:px-8 lg:px-12" tabIndex={-1}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <div className="flex items-center gap-2">
              <NetworkIcon aria-hidden="true" />
              <p className="text-sm font-medium tracking-wide" translate="no">
                SYNC CANVAS
              </p>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">把想法放到同一张画布上</h1>
            <p className="max-w-xl text-pretty leading-7 text-muted-foreground">
              创建节点、连接关系，并与打开同一链接的协作者实时编辑。
            </p>
            <Badge variant="outline" className="mt-1">
              示例环境：获得链接即可编辑，无权限控制
            </Badge>
          </div>
          <CanvasFormDialog
            title="创建 Canvas"
            description="从一张空画布开始组织共享知识。"
            submitLabel="创建并打开"
            onSubmit={onCreate}
            trigger={
              <Button size="lg">
                <PlusIcon data-icon="inline-start" />
                创建 Canvas
              </Button>
            }
          />
        </header>

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>无法加载 Canvas</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section aria-labelledby="canvas-list-heading" className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="canvas-list-heading" className="text-xl font-medium">
                你的 Canvas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">当前实例中的共享画布。</p>
            </div>
            {!loading ? <Badge variant="secondary">{canvases.length} 个</Badge> : null}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="正在加载 Canvas">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-44" />
              ))}
            </div>
          ) : canvases.length === 0 ? (
            <Empty className="min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <NetworkIcon />
                </EmptyMedia>
                <EmptyTitle>还没有 Canvas</EmptyTitle>
                <EmptyDescription>创建第一张空画布，然后复制链接邀请协作者。</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CanvasFormDialog
                  title="创建 Canvas"
                  description="从一张空画布开始组织共享知识。"
                  submitLabel="创建并打开"
                  onSubmit={onCreate}
                  trigger={
                    <Button>
                      <PlusIcon data-icon="inline-start" />
                      创建 Canvas
                    </Button>
                  }
                />
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {canvases.map((canvas) => (
                <li key={canvas.id}>
                  <Card className="h-full" size="sm">
                    <CardHeader>
                      <CardTitle className="truncate pr-2">{canvas.title}</CardTitle>
                      <CardDescription>更新于 {dateFormatter.format(new Date(canvas.updatedAt))}</CardDescription>
                      <CardAction className="flex gap-1">
                        <CanvasFormDialog
                          title="重命名 Canvas"
                          description="协作者会在顶部栏看到新的名称。"
                          initialTitle={canvas.title}
                          submitLabel="保存名称"
                          onSubmit={(title) => onRename(canvas.id, title)}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`重命名 ${canvas.title}`}>
                              <PencilIcon />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button variant="ghost" size="icon-sm" aria-label={`删除 ${canvas.title}`} />}
                          >
                            <Trash2Icon />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>删除“{canvas.title}”？</AlertDialogTitle>
                              <AlertDialogDescription>
                                Canvas 内容会永久删除，正在协作的客户端将退出该画布。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => onDelete(canvas.id)}>
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={`/canvases/${canvas.id}`}
                        className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                      >
                        打开协作画布
                        <ArrowUpRightIcon data-icon="inline-end" />
                      </a>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasesQuery = useQuery({ queryKey: ['canvases'], queryFn: listCanvases });
  const createMutation = useMutation({
    mutationFn: createCanvas,
    async onSuccess(canvas) {
      await queryClient.invalidateQueries({ queryKey: ['canvases'] });
      await navigate({ to: '/canvases/$canvasId', params: { canvasId: canvas.id } });
    },
  });
  const renameMutation = useMutation({
    mutationFn: ({ canvasId, title }: { canvasId: string; title: string }) => renameCanvas(canvasId, title),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['canvases'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCanvas,
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['canvases'] });
    },
  });
  const mutationError = createMutation.error ?? renameMutation.error ?? deleteMutation.error;

  return (
    <HomeView
      canvases={canvasesQuery.data ?? []}
      error={(canvasesQuery.error ?? mutationError)?.message}
      loading={canvasesQuery.isLoading}
      onCreate={async (title) => {
        await createMutation.mutateAsync(title);
      }}
      onDelete={(canvasId) => deleteMutation.mutateAsync(canvasId)}
      onRename={async (canvasId, title) => {
        await renameMutation.mutateAsync({ canvasId, title });
      }}
    />
  );
}
