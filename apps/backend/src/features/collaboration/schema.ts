import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { canvases } from '../canvases/schema.ts';

export const canvasDocuments = sqliteTable('canvas_documents', {
  canvasId: text('canvas_id')
    .primaryKey()
    .references(() => canvases.id, { onDelete: 'cascade' }),
  state: blob('state', { mode: 'buffer' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
