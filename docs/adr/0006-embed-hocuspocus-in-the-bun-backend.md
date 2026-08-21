# Embed Hocuspocus in the Bun backend

Hono and Hocuspocus v4 run in the existing Bun backend process: Hono serves the HTTP API and Hocuspocus serves the Yjs WebSocket protocol. Hocuspocus persistence integrates with the application's existing SQLite and Drizzle boundary, avoiding both a separate collaboration service and a custom implementation of the Yjs wire protocol.
