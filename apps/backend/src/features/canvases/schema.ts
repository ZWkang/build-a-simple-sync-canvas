import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const canvases = sqliteTable('canvases', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const createCanvasInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const canvasResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateCanvasInput = z.infer<typeof createCanvasInputSchema>;
export type CanvasRecord = typeof canvases.$inferSelect;
