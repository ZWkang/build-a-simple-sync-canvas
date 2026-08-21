import * as Y from 'yjs';
import { z } from 'zod';

export const nodeColors = ['sand', 'sky', 'mint', 'rose'] as const;

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const nodeValueSchema = z.object({
  body: z.string(),
  color: z.enum(nodeColors),
  position: pointSchema,
  title: z.string(),
});

const updateNodeInputSchema = nodeValueSchema.pick({ body: true, color: true, title: true }).partial();

const connectionValueSchema = z.object({
  source: z.string().uuid(),
  target: z.string().uuid(),
});

export type NodeColor = (typeof nodeColors)[number];

export interface Point {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  body: string;
  color: NodeColor;
  position: Point;
  title: string;
}

export interface CanvasConnection {
  id: string;
  source: string;
  target: string;
}

export interface CanvasSnapshot {
  connections: CanvasConnection[];
  nodes: CanvasNode[];
}

type CreateNodeInput = Omit<CanvasNode, 'id'>;
type UpdateNodeInput = Partial<Pick<CanvasNode, 'body' | 'color' | 'title'>>;

export class CanvasDocument {
  private readonly connections: Y.Map<Y.Map<unknown>>;
  private readonly cleanupOrigin = Symbol('canvas-document-cleanup-origin');
  private readonly listeners = new Set<() => void>();
  private readonly localOrigin = Symbol('canvas-document-local-origin');
  private readonly nodes: Y.Map<Y.Map<unknown>>;
  private readonly undoManager: Y.UndoManager;
  private gestureActive = false;
  private snapshot: CanvasSnapshot;

  public constructor(private readonly document: Y.Doc) {
    this.nodes = document.getMap('nodes');
    this.connections = document.getMap('connections');
    this.removeInvalidConnections();
    this.snapshot = this.readSnapshot();
    this.undoManager = new Y.UndoManager([this.nodes, this.connections], {
      captureTimeout: Number.MAX_SAFE_INTEGER,
      trackedOrigins: new Set([this.localOrigin]),
    });
    document.on('afterTransaction', this.publishSnapshot);
  }

  public createNode(input: CreateNodeInput): string {
    const parsedInput = nodeValueSchema.parse(input);
    const nodeId = crypto.randomUUID();
    const node = new Y.Map<unknown>();
    node.set('title', parsedInput.title);
    node.set('body', parsedInput.body);
    node.set('color', parsedInput.color);
    node.set('position', parsedInput.position);

    this.transact(() => {
      this.nodes.set(nodeId, node);
    });

    return nodeId;
  }

  public beginGesture(): void {
    if (this.gestureActive) {
      throw new Error('A Canvas gesture is already active');
    }

    this.undoManager.stopCapturing();
    this.gestureActive = true;
  }

  public canRedo(): boolean {
    return this.undoManager.redoStack.length > 0;
  }

  public canUndo(): boolean {
    return this.undoManager.undoStack.length > 0;
  }

  public connectNodes(source: string, target: string): string {
    if (source === target) {
      throw new Error('A Node cannot connect to itself');
    }

    this.requireNode(source);
    this.requireNode(target);
    const connectionId = `${source}:${target}`;

    if (this.connections.has(connectionId)) {
      return connectionId;
    }

    const connection = new Y.Map<unknown>();
    connection.set('source', source);
    connection.set('target', target);
    this.transact(() => {
      this.connections.set(connectionId, connection);
    });

    return connectionId;
  }

  public deleteConnection(connectionId: string): void {
    if (!this.connections.has(connectionId)) {
      throw new Error(`Connection ${connectionId} does not exist`);
    }

    this.transact(() => {
      this.connections.delete(connectionId);
    });
  }

  public deleteNode(nodeId: string): void {
    this.requireNode(nodeId);
    this.transact(() => {
      this.nodes.delete(nodeId);

      for (const [connectionId, connection] of this.connections) {
        if (connection.get('source') === nodeId || connection.get('target') === nodeId) {
          this.connections.delete(connectionId);
        }
      }
    });
  }

  public endGesture(): void {
    if (!this.gestureActive) {
      throw new Error('No Canvas gesture is active');
    }

    this.gestureActive = false;
    this.undoManager.stopCapturing();
  }

  public getSnapshot(): CanvasSnapshot {
    return this.snapshot;
  }

  public moveNode(nodeId: string, position: Point): void {
    const node = this.requireNode(nodeId);
    const parsedPosition = pointSchema.parse(position);
    this.transact(() => {
      node.set('position', parsedPosition);
    });
  }

  public updateNode(nodeId: string, input: UpdateNodeInput): void {
    const node = this.requireNode(nodeId);
    const parsedInput = updateNodeInputSchema.parse(input);
    this.transact(() => {
      if (parsedInput.title !== undefined) {
        node.set('title', parsedInput.title);
      }
      if (parsedInput.body !== undefined) {
        node.set('body', parsedInput.body);
      }
      if (parsedInput.color !== undefined) {
        node.set('color', parsedInput.color);
      }
    });
  }

  public redo(): void {
    this.undoManager.stopCapturing();
    this.undoManager.redo();
    this.undoManager.stopCapturing();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public undo(): void {
    this.undoManager.stopCapturing();
    this.undoManager.undo();
    this.undoManager.stopCapturing();
  }

  public destroy(): void {
    this.document.off('afterTransaction', this.publishSnapshot);
    this.listeners.clear();
    this.undoManager.destroy();
    this.document.destroy();
  }

  private readonly publishSnapshot = () => {
    if (this.removeInvalidConnections()) {
      return;
    }

    this.snapshot = this.readSnapshot();
    this.listeners.forEach((listener) => listener());
  };

  private removeInvalidConnections(): boolean {
    const invalidConnectionIds: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      if (!(connection instanceof Y.Map)) {
        throw new Error(`Connection ${connectionId} is invalid`);
      }

      const source = connection.get('source');
      const target = connection.get('target');

      if (typeof source !== 'string' || typeof target !== 'string') {
        throw new Error(`Connection ${connectionId} has invalid endpoints`);
      }

      if (!this.nodes.has(source) || !this.nodes.has(target) || source === target) {
        invalidConnectionIds.push(connectionId);
      }
    }

    if (invalidConnectionIds.length === 0) {
      return false;
    }

    this.document.transact(() => {
      invalidConnectionIds.forEach((connectionId) => this.connections.delete(connectionId));
    }, this.cleanupOrigin);
    return true;
  }

  private requireNode(nodeId: string): Y.Map<unknown> {
    const node = this.nodes.get(nodeId);

    if (!node) {
      throw new Error(`Node ${nodeId} does not exist`);
    }

    return node;
  }

  private transact(action: () => void): void {
    if (!this.gestureActive) {
      this.undoManager.stopCapturing();
    }
    this.document.transact(action, this.localOrigin);
    if (!this.gestureActive) {
      this.undoManager.stopCapturing();
    }
  }

  private readSnapshot(): CanvasSnapshot {
    const nodes = Array.from(this.nodes.entries(), ([id, node]) => {
      if (!(node instanceof Y.Map)) {
        throw new Error(`Node ${id} is invalid`);
      }

      const parsed = nodeValueSchema.safeParse({
        body: node.get('body'),
        color: node.get('color'),
        position: node.get('position'),
        title: node.get('title'),
      });

      if (!parsed.success) {
        throw new Error(`Node ${id} is invalid`, { cause: parsed.error });
      }

      return { id, ...parsed.data };
    });

    return {
      connections: Array.from(this.connections.entries(), ([id, connection]) => {
        if (!(connection instanceof Y.Map)) {
          throw new Error(`Connection ${id} is invalid`);
        }

        const parsed = connectionValueSchema.safeParse({
          source: connection.get('source'),
          target: connection.get('target'),
        });

        if (!parsed.success) {
          throw new Error(`Connection ${id} is invalid`, { cause: parsed.error });
        }

        return { id, ...parsed.data };
      }),
      nodes,
    };
  }
}
