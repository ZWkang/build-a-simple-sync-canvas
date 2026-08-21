import { Database as HocuspocusDatabase } from '@hocuspocus/extension-database';
import { Hocuspocus, type WebSocketLike } from '@hocuspocus/server';
import crossws from 'crossws/adapters/bun';

import type { AppDatabase } from '../../db/client.ts';
import { CanvasRepository } from '../canvases/repository.ts';
import { CanvasDocumentRepository } from './document-repository.ts';

export function createCollaborationServer(database: AppDatabase) {
  const canvases = new CanvasRepository(database);
  const documents = new CanvasDocumentRepository(database);
  const closingCanvases = new Set<string>();
  const unloadWaiters = new Map<string, Set<() => void>>();
  const hocuspocus = new Hocuspocus({
    extensions: [
      new HocuspocusDatabase({
        fetch: async ({ documentName }) => documents.load(documentName),
        store: async ({ documentName, state }) => documents.store(documentName, state),
      }),
    ],
    async onConnect({ documentName }) {
      if (closingCanvases.has(documentName)) {
        throw new Error('Canvas is being deleted');
      }

      const canvas = await canvases.get(documentName);

      if (!canvas) {
        throw new Error('Canvas not found');
      }
    },
    async afterUnloadDocument({ documentName }) {
      const waiters = unloadWaiters.get(documentName);
      waiters?.forEach((resolve) => resolve());
      unloadWaiters.delete(documentName);
    },
  });
  const connections = new WeakMap<object, ReturnType<typeof hocuspocus.handleConnection>>();
  const adapter = crossws({
    hooks: {
      open(peer) {
        const webSocket: WebSocketLike = {
          get readyState() {
            return peer.websocket.readyState ?? WebSocket.CLOSED;
          },
          send(data) {
            peer.send(data);
          },
          close(code, reason) {
            peer.close(code, reason);
          },
        };
        connections.set(peer, hocuspocus.handleConnection(webSocket, peer.request));
      },
      message(peer, message) {
        connections.get(peer)?.handleMessage(message.uint8Array());
      },
      close(peer, event) {
        const connection = connections.get(peer);

        if (event.code === undefined || event.reason === undefined) {
          connection?.handleClose();
        } else {
          connection?.handleClose({
            code: event.code,
            reason: event.reason,
          });
        }
        connections.delete(peer);
      },
      error(peer, error) {
        console.error(`Collaboration WebSocket error for peer ${peer.id}`, error);
      },
    },
  });
  let destroyPromise: Promise<void> | undefined;

  async function destroy() {
    destroyPromise ??= (async () => {
      await new Promise<void>((resolve) => {
        hocuspocus.configuration.extensions.push({
          async afterUnloadDocument({ instance }) {
            if (instance.getDocumentsCount() === 0) {
              resolve();
            }
          },
        });

        if (hocuspocus.getDocumentsCount() === 0) {
          resolve();
          return;
        }

        hocuspocus.closeConnections();
        hocuspocus.flushPendingStores();
      });
      await hocuspocus.hooks('onDestroy', { instance: hocuspocus });
    })();

    return destroyPromise;
  }

  function waitForCanvasToUnload(canvasId: string): Promise<void> {
    if (!hocuspocus.documents.has(canvasId)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const waiters = unloadWaiters.get(canvasId) ?? new Set();
      waiters.add(resolve);
      unloadWaiters.set(canvasId, waiters);
    });
  }

  async function deleteCanvas(canvasId: string): Promise<boolean> {
    if (!(await canvases.get(canvasId))) {
      return false;
    }

    closingCanvases.add(canvasId);

    try {
      const document = hocuspocus.documents.get(canvasId);
      const unloaded = waitForCanvasToUnload(canvasId);
      document?.broadcastStateless(JSON.stringify({ type: 'canvas-deleted' }));
      hocuspocus.closeConnections(canvasId);
      hocuspocus.flushPendingStores();
      await unloaded;
      return await canvases.delete(canvasId);
    } finally {
      closingCanvases.delete(canvasId);
    }
  }

  return {
    fetch(request: Request, server: Bun.Server<unknown>) {
      const url = new URL(request.url);

      if (url.pathname !== '/api/collaboration' || request.headers.get('upgrade') !== 'websocket') {
        return new Response('Not Found', { status: 404 });
      }

      return adapter.handleUpgrade(request, server);
    },
    websocket: adapter.websocket,
    hocuspocus,
    deleteCanvas,
    destroy,
  };
}
