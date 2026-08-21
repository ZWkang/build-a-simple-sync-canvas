import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import type { AppDatabase } from '../../db/client.ts';
import { CanvasRepository } from './repository.ts';
import {
  canvasIdParamSchema,
  canvasResponseSchema,
  createCanvasInputSchema,
  updateCanvasInputSchema,
  type CanvasRecord,
} from './schema.ts';

function toCanvasResponse(canvas: CanvasRecord) {
  return canvasResponseSchema.parse({
    ...canvas,
    createdAt: canvas.createdAt.toISOString(),
    updatedAt: canvas.updatedAt.toISOString(),
  });
}

function validationError(error: { issues: unknown[] }) {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      issues: error.issues,
    },
  };
}

export function createCanvasRoutes(
  database: AppDatabase,
  collaboration: { deleteCanvas(canvasId: string): Promise<boolean> },
) {
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
          return context.json(validationError(result.error), 400);
        }
      }),
      async (context) => {
        const input = context.req.valid('json');
        const canvas = await repository.create(input);
        return context.json({ data: toCanvasResponse(canvas) }, 201);
      },
    )
    .get('/:canvasId', zValidator('param', canvasIdParamSchema), async (context) => {
      const { canvasId } = context.req.valid('param');
      const canvas = await repository.get(canvasId);

      if (!canvas) {
        return context.json({ error: { code: 'CANVAS_NOT_FOUND' } }, 404);
      }

      return context.json({ data: toCanvasResponse(canvas) });
    })
    .patch(
      '/:canvasId',
      zValidator('param', canvasIdParamSchema),
      zValidator('json', updateCanvasInputSchema, (result, context) => {
        if (!result.success) {
          return context.json(validationError(result.error), 400);
        }
      }),
      async (context) => {
        const { canvasId } = context.req.valid('param');
        const canvas = await repository.update(canvasId, context.req.valid('json'));

        if (!canvas) {
          return context.json({ error: { code: 'CANVAS_NOT_FOUND' } }, 404);
        }

        return context.json({ data: toCanvasResponse(canvas) });
      },
    )
    .delete('/:canvasId', zValidator('param', canvasIdParamSchema), async (context) => {
      const { canvasId } = context.req.valid('param');
      const deleted = await collaboration.deleteCanvas(canvasId);

      if (!deleted) {
        return context.json({ error: { code: 'CANVAS_NOT_FOUND' } }, 404);
      }

      return context.body(null, 204);
    });
}
