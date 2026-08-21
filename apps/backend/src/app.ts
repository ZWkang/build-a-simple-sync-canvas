import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { AppDatabase } from './db/client.ts';
import { createCanvasRoutes } from './features/canvases/routes.ts';
import type { createCollaborationServer } from './features/collaboration/collaboration-server.ts';
import { healthRoutes } from './features/health/routes.ts';

type CollaborationServer = Pick<ReturnType<typeof createCollaborationServer>, 'deleteCanvas'>;

export function createApp(database: AppDatabase, collaboration: CollaborationServer) {
  return new Hono()
    .use('/api/*', cors())
    .route('/api/health', healthRoutes)
    .route('/api/canvases', createCanvasRoutes(database, collaboration));
}
