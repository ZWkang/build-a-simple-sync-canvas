import { desc } from 'drizzle-orm';

import type { AppDatabase } from '../../db/client.ts';
import { canvases, type CanvasRecord, type CreateCanvasInput } from './schema.ts';

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
}
