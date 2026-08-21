import { createFileRoute } from '@tanstack/react-router';

import { CanvasPage } from '@/features/canvas/canvas-page.tsx';

export const Route = createFileRoute('/canvases/$canvasId')({
  component: CanvasRoute,
});

function CanvasRoute() {
  const { canvasId } = Route.useParams();
  return <CanvasPage canvasId={canvasId} />;
}
