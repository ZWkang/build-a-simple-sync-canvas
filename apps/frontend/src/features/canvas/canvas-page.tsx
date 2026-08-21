import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon, NetworkIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import { buttonVariants } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { getCanvas } from '@/features/canvases/api.ts';
import {
  loadCollaboratorProfile,
  saveCollaboratorProfile,
  type CollaboratorProfile,
} from '@/features/canvas/collaboration/collaborator-profile.ts';
import { CanvasWorkspace } from '@/features/canvas/components/canvas-workspace.tsx';
import { CollaboratorProfileDialog } from '@/features/canvas/components/collaborator-profile-dialog.tsx';

export function CanvasPage({ canvasId }: { canvasId: string }) {
  const canvasQuery = useQuery({
    queryKey: ['canvases', canvasId],
    queryFn: () => getCanvas(canvasId),
  });
  const [profile, setProfile] = useState<CollaboratorProfile | null>(() =>
    loadCollaboratorProfile(window.localStorage),
  );

  function handleProfileSave(nextProfile: CollaboratorProfile) {
    saveCollaboratorProfile(window.localStorage, nextProfile);
    setProfile(nextProfile);
  }

  if (canvasQuery.isLoading) {
    return (
      <main id="main-content" className="flex min-h-dvh flex-col gap-4 p-6" tabIndex={-1}>
        <Skeleton className="h-14" />
        <Skeleton className="min-h-[calc(100dvh-6.5rem)]" />
      </main>
    );
  }

  if (canvasQuery.error || !canvasQuery.data) {
    return (
      <main id="main-content" className="grid min-h-dvh place-items-center p-6" tabIndex={-1}>
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircleIcon />
          <AlertTitle>无法打开 Canvas</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-4">
            <span>{canvasQuery.error?.message ?? 'Canvas 不存在。'}</span>
            <a href="/" className={buttonVariants({ variant: 'outline' })}>
              返回首页
            </a>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!profile) {
    return (
      <main id="main-content" className="grid min-h-dvh place-items-center bg-muted/30 p-6" tabIndex={-1}>
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <NetworkIcon />
          </div>
          <h1 className="text-2xl font-semibold">{canvasQuery.data.title}</h1>
          <p className="text-muted-foreground">设置浏览器本地身份后加入实时协作。</p>
        </div>
        <CollaboratorProfileDialog profile={null} onSave={handleProfileSave} />
      </main>
    );
  }

  return <CanvasWorkspace canvas={canvasQuery.data} initialProfile={profile} />;
}
