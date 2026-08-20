import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { drizzle } from 'drizzle-orm/bun-sqlite';

export function createDatabase(filename: string) {
  const databaseDirectory = dirname(filename);

  if (filename !== ':memory:' && databaseDirectory !== '.') {
    mkdirSync(databaseDirectory, { recursive: true });
  }

  const sqlite = new Database(filename, { create: true, strict: true });
  sqlite.run('PRAGMA foreign_keys = ON');

  return {
    db: drizzle({ client: sqlite }),
    close: () => sqlite.close(),
  };
}

export type AppDatabase = ReturnType<typeof createDatabase>['db'];
