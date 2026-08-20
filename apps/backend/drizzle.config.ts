import { defineConfig } from 'drizzle-kit';

import { loadEnv } from './src/env.ts';

const env = loadEnv(process.env);

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/features/**/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
