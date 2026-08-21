import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { join } from 'node:path';

import { HocuspocusProvider } from '@hocuspocus/provider';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as Y from 'yjs';

import { createDatabase } from '../../db/client.ts';
import { CanvasRepository } from '../canvases/repository.ts';
import { createCollaborationServer } from './collaboration-server.ts';
import { CanvasDocumentRepository } from './document-repository.ts';

const migrationsFolder = join(import.meta.dir, '../../../drizzle');

async function waitFor(check: () => boolean, description: string): Promise<void> {
  const deadline = Date.now() + 3_000;

  while (!check()) {
    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for ${description}`);
    }

    await Bun.sleep(10);
  }
}

describe('Canvas collaboration server', () => {
  let connection: ReturnType<typeof createDatabase>;
  let server: ReturnType<typeof Bun.serve> | undefined;
  let collaboration: ReturnType<typeof createCollaborationServer> | undefined;
  const providers: HocuspocusProvider[] = [];

  beforeEach(() => {
    connection = createDatabase(':memory:');
    migrate(connection.db, { migrationsFolder });
  });

  afterEach(async () => {
    for (const provider of providers) {
      provider.destroy();
    }
    providers.length = 0;
    await collaboration?.destroy();
    server?.stop(true);
    connection.close();
  });

  it('synchronizes a Yjs document between Collaborators', async () => {
    const canvas = await new CanvasRepository(connection.db).create({ title: 'Architecture map' });
    collaboration = createCollaborationServer(connection.db);
    server = Bun.serve({
      port: 0,
      fetch: collaboration.fetch,
      websocket: collaboration.websocket,
    });
    const url = `ws://127.0.0.1:${server.port}/api/collaboration`;
    const firstDocument = new Y.Doc();
    const secondDocument = new Y.Doc();
    const firstProvider = new HocuspocusProvider({ document: firstDocument, name: canvas.id, url });
    const secondProvider = new HocuspocusProvider({ document: secondDocument, name: canvas.id, url });
    providers.push(firstProvider, secondProvider);

    await waitFor(() => firstProvider.synced && secondProvider.synced, 'both Collaborators to sync');

    firstDocument.getMap('nodes').set('node-1', 'Shared node');

    await waitFor(() => secondDocument.getMap('nodes').get('node-1') === 'Shared node', 'the remote Canvas update');
    expect(secondDocument.getMap('nodes').get('node-1')).toBe('Shared node');
  });

  it('notifies Collaborators and removes durable state when a Canvas is deleted', async () => {
    const canvases = new CanvasRepository(connection.db);
    const documents = new CanvasDocumentRepository(connection.db);
    const canvas = await canvases.create({ title: 'Disposable map' });
    collaboration = createCollaborationServer(connection.db);
    server = Bun.serve({
      port: 0,
      fetch: collaboration.fetch,
      websocket: collaboration.websocket,
    });
    let deletionMessage: string | undefined;
    let provider: HocuspocusProvider;
    provider = new HocuspocusProvider({
      document: new Y.Doc(),
      name: canvas.id,
      url: `ws://127.0.0.1:${server.port}/api/collaboration`,
      onStateless({ payload }) {
        deletionMessage = payload;
        provider.destroy();
      },
    });
    providers.push(provider);
    await waitFor(() => provider.synced, 'the Collaborator to sync');
    provider.document.getMap('nodes').set('node-1', 'To be deleted');
    await waitFor(() => collaboration?.hocuspocus.documents.has(canvas.id) === true, 'the Canvas room');

    expect(await collaboration.deleteCanvas(canvas.id)).toBe(true);

    await waitFor(() => deletionMessage !== undefined, 'the Canvas deletion message');
    expect(JSON.parse(deletionMessage ?? '')).toEqual({ type: 'canvas-deleted' });
    expect(await canvases.get(canvas.id)).toBeUndefined();
    expect(await documents.load(canvas.id)).toBeNull();
  });
});
