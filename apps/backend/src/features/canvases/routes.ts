import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import type { AppDatabase } from '../../db/client.ts';
import { CanvasRepository } from './repository.ts';
import { canvasResponseSchema, createCanvasInputSchema, type CanvasRecord } from './schema.ts';

function toCanvasResponse(canvas: CanvasRecord) {
  return canvasResponseSchema.parse({
    ...canvas,
    createdAt: canvas.createdAt.toISOString(),
    updatedAt: canvas.updatedAt.toISOString(),
  });
}

export function createCanvasRoutes(database: AppDatabase) {
  const repository = new CanvasRepository(database);

  return new Hono()
    .get('/', async (context) => {
      const canvases = await repository.list();
      return context.json({ data: canvases.map(toCanvasResponse) });
    })
    .post(
      '/',
      zValidator('json', createCanvasInputSchema, (result, context) => {
        if (!result.success) {
          return context.json(
            {
              error: {
                code: 'VALIDATION_ERROR',
                issues: result.error.issues,
              },
            },
            400,
          );
        }
      }),
      async (context) => {
        const input = context.req.valid('json');
        const canvas = await repository.create(input);
        return context.json({ data: toCanvasResponse(canvas) }, 201);
      },
    );
}
