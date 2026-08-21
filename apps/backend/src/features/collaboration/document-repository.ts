import { eq } from 'drizzle-orm';

import type { AppDatabase } from '../../db/client.ts';
import { canvasDocuments } from './schema.ts';

export class CanvasDocumentRepository {
  public constructor(private readonly database: AppDatabase) {}

  public async load(canvasId: string): Promise<Uint8Array | null> {
    const [document] = await this.database
      .select({ state: canvasDocuments.state })
      .from(canvasDocuments)
      .where(eq(canvasDocuments.canvasId, canvasId))
      .limit(1);

    return document ? new Uint8Array(document.state) : null;
  }

  public async store(canvasId: string, state: Uint8Array): Promise<void> {
    await this.database
      .insert(canvasDocuments)
      .values({
        canvasId,
        state: Buffer.from(state),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: canvasDocuments.canvasId,
        set: {
          state: Buffer.from(state),
          updatedAt: new Date(),
        },
      });
  }
}
