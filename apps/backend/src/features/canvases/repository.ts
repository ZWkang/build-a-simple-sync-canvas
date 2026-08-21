import { desc, eq } from 'drizzle-orm';

import type { AppDatabase } from '../../db/client.ts';
import { canvases, type CanvasRecord, type CreateCanvasInput, type UpdateCanvasInput } from './schema.ts';

export class CanvasRepository {
  public constructor(private readonly database: AppDatabase) {}

  public async list(): Promise<CanvasRecord[]> {
    return this.database.select().from(canvases).orderBy(desc(canvases.createdAt));
  }

  public async create(input: CreateCanvasInput): Promise<CanvasRecord> {
    const now = new Date();
    const [createdCanvas] = await this.database
      .insert(canvases)
      .values({
        id: crypto.randomUUID(),
        title: input.title,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!createdCanvas) {
      throw new Error('SQLite did not return the created canvas');
    }

    return createdCanvas;
  }

  public async get(canvasId: string): Promise<CanvasRecord | undefined> {
    const [canvas] = await this.database.select().from(canvases).where(eq(canvases.id, canvasId)).limit(1);
    return canvas;
  }

  public async update(canvasId: string, input: UpdateCanvasInput): Promise<CanvasRecord | undefined> {
    const [updatedCanvas] = await this.database
      .update(canvases)
      .set({
        title: input.title,
        updatedAt: new Date(),
      })
      .where(eq(canvases.id, canvasId))
      .returning();

    return updatedCanvas;
  }

  public async delete(canvasId: string): Promise<boolean> {
    const [deletedCanvas] = await this.database
      .delete(canvases)
      .where(eq(canvases.id, canvasId))
      .returning({ id: canvases.id });

    return deletedCanvas !== undefined;
  }
}
