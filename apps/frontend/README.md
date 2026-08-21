# Sync Canvas Frontend

Browser-only React application for the Canvas list and collaborative node editor.

```bash
bun run dev
bun run test
bun run typecheck
bun run build
```

React Flow owns graph interaction. [`CanvasDocument`](./src/features/canvas/model/canvas-document.ts) owns the Yjs node and Connection model, invariants, snapshots, and local UndoManager. [`CanvasCollaborationSession`](./src/features/canvas/collaboration/canvas-collaboration-session.ts) owns the Hocuspocus Provider and Awareness Presence.

Optional build-time environment variables:

```bash
VITE_API_URL=http://localhost:3001
VITE_COLLABORATION_URL=ws://localhost:3001/api/collaboration
```

Authentication, offline editing, server functions, frontend database access, and deployment configuration remain outside this application.
