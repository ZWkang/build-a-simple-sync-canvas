import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { join } from 'node:path';

import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { createApp } from './app.ts';
import { createDatabase } from './db/client.ts';
import { canvasResponseSchema } from './features/canvases/schema.ts';
import { createCollaborationServer } from './features/collaboration/collaboration-server.ts';

const migrationsFolder = join(import.meta.dir, '../drizzle');

describe('canvas API', () => {
  let connection: ReturnType<typeof createDatabase>;
  let app: ReturnType<typeof createApp>;
  let collaboration: ReturnType<typeof createCollaborationServer>;

  beforeEach(() => {
    connection = createDatabase(':memory:');
    migrate(connection.db, { migrationsFolder });
    collaboration = createCollaborationServer(connection.db);
    app = createApp(connection.db, collaboration);
  });

  afterEach(async () => {
    await collaboration.destroy();
    connection.close();
  });

  it('reports service health', async () => {
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('creates and lists a canvas through SQLite', async () => {
    const createResponse = await app.request('/api/canvases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Planning board' }),
    });

    expect(createResponse.status).toBe(201);
    const createdBody = (await createResponse.json()) as { data: unknown };
    const createdCanvas = canvasResponseSchema.parse(createdBody.data);
    expect(createdCanvas.title).toBe('Planning board');

    const listResponse = await app.request('/api/canvases');
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual({ data: [createdCanvas] });
  });

  it('rejects an empty canvas title', async () => {
    const response = await app.request('/api/canvases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });

    expect(response.status).toBe(400);
  });

  it('retrieves, renames, and deletes a Canvas through its HTTP interface', async () => {
    const createResponse = await app.request('/api/canvases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Product map' }),
    });
    const createdBody = (await createResponse.json()) as { data: unknown };
    const createdCanvas = canvasResponseSchema.parse(createdBody.data);

    const getResponse = await app.request(`/api/canvases/${createdCanvas.id}`);
    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual({ data: createdCanvas });

    const renameResponse = await app.request(`/api/canvases/${createdCanvas.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Architecture map' }),
    });
    expect(renameResponse.status).toBe(200);
    const renamedBody = (await renameResponse.json()) as { data: unknown };
    const renamedCanvas = canvasResponseSchema.parse(renamedBody.data);
    expect(renamedCanvas).toMatchObject({
      id: createdCanvas.id,
      title: 'Architecture map',
      createdAt: createdCanvas.createdAt,
    });

    const deleteResponse = await app.request(`/api/canvases/${createdCanvas.id}`, {
      method: 'DELETE',
    });
    expect(deleteResponse.status).toBe(204);

    const missingResponse = await app.request(`/api/canvases/${createdCanvas.id}`);
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toEqual({
      error: { code: 'CANVAS_NOT_FOUND' },
    });
  });
});
