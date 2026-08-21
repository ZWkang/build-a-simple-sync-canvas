import { createApp } from './app.ts';
import { createDatabase } from './db/client.ts';
import { loadEnv } from './env.ts';
import { createCollaborationServer } from './features/collaboration/collaboration-server.ts';

const env = loadEnv(process.env);
const { db } = createDatabase(env.DATABASE_URL);
const collaboration = createCollaborationServer(db);
const app = createApp(db, collaboration);

export type AppType = typeof app;

export default {
  port: env.PORT,
  fetch(request: Request, server: Bun.Server<unknown>) {
    if (request.headers.get('upgrade') === 'websocket') {
      return collaboration.fetch(request, server);
    }

    return app.fetch(request);
  },
  websocket: collaboration.websocket,
};
