import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { join } from 'node:path';

import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { createDatabase } from '../../db/client.ts';
import { CanvasRepository } from '../canvases/repository.ts';
import { CanvasDocumentRepository } from './document-repository.ts';

const migrationsFolder = join(import.meta.dir, '../../../drizzle');

describe('Canvas document persistence', () => {
  let connection: ReturnType<typeof createDatabase>;

  beforeEach(() => {
    connection = createDatabase(':memory:');
    migrate(connection.db, { migrationsFolder });
  });

  afterEach(() => {
    connection.close();
  });

  it('loads the latest Yjs state for a Canvas', async () => {
    const canvasRepository = new CanvasRepository(connection.db);
    const canvas = await canvasRepository.create({ title: 'Architecture map' });
    const documents = new CanvasDocumentRepository(connection.db);

    expect(await documents.load(canvas.id)).toBeNull();

    await documents.store(canvas.id, new Uint8Array([1, 2, 3]));
    expect(await documents.load(canvas.id)).toEqual(new Uint8Array([1, 2, 3]));

    await documents.store(canvas.id, new Uint8Array([8, 13]));
    expect(await documents.load(canvas.id)).toEqual(new Uint8Array([8, 13]));
  });
});
