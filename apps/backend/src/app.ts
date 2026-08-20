import { Hono } from 'hono';

import type { AppDatabase } from './db/client.ts';
import { createCanvasRoutes } from './features/canvases/routes.ts';
import { healthRoutes } from './features/health/routes.ts';

export function createApp(database: AppDatabase) {
  return new Hono().route('/api/health', healthRoutes).route('/api/canvases', createCanvasRoutes(database));
}
