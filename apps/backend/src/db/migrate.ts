import { resolve } from 'node:path';

import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { loadEnv } from '../env.ts';
import { createDatabase } from './client.ts';

const env = loadEnv(process.env);
const connection = createDatabase(env.DATABASE_URL);

try {
  migrate(connection.db, {
    migrationsFolder: resolve(process.cwd(), 'drizzle'),
  });
} finally {
  connection.close();
}

console.info(`Applied SQLite migrations to ${env.DATABASE_URL}`);
