import { createApp } from './app.ts';
import { createDatabase } from './db/client.ts';
import { loadEnv } from './env.ts';

const env = loadEnv(process.env);
const { db } = createDatabase(env.DATABASE_URL);
const app = createApp(db);

export type AppType = typeof app;

export default {
  port: env.PORT,
  fetch: app.fetch,
};
