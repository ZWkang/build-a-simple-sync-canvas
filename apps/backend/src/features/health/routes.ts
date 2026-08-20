import { Hono } from 'hono';
import { z } from 'zod';

const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export const healthRoutes = new Hono().get('/', (context) => {
  return context.json(healthResponseSchema.parse({ status: 'ok' }));
});
