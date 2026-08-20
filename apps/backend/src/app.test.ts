import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { join } from 'node:path';

import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { createApp } from './app.ts';
import { createDatabase } from './db/client.ts';
import { canvasResponseSchema } from './features/canvases/schema.ts';

const migrationsFolder = join(import.meta.dir, '../drizzle');

describe('canvas API', () => {
  let connection: ReturnType<typeof createDatabase>;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    connection = createDatabase(':memory:');
    migrate(connection.db, { migrationsFolder });
    app = createApp(connection.db);
  });

  afterEach(() => {
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
});
