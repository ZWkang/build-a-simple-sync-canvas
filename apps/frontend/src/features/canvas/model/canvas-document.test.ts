import { describe, expect, it } from 'bun:test';

import * as Y from 'yjs';

import { CanvasDocument } from './canvas-document.ts';

describe('CanvasDocument', () => {
  it('creates a Node and exposes it through the Canvas snapshot', () => {
    const document = new CanvasDocument(new Y.Doc());

    const nodeId = document.createNode({
      body: 'Capture the collaboration boundary.',
      color: 'sky',
      position: { x: 120, y: 80 },
      title: 'Shared model',
    });

    expect(document.getSnapshot()).toEqual({
      connections: [],
      nodes: [
        {
          id: nodeId,
          body: 'Capture the collaboration boundary.',
          color: 'sky',
          position: { x: 120, y: 80 },
          title: 'Shared model',
        },
      ],
    });
    document.destroy();
  });

  it('publishes a new snapshot when a remote Yjs update arrives', () => {
    const sourceYDocument = new Y.Doc();
    const targetYDocument = new Y.Doc();
    const source = new CanvasDocument(sourceYDocument);
    const target = new CanvasDocument(targetYDocument);
    let publishedSnapshots = 0;
    const unsubscribe = target.subscribe(() => {
      publishedSnapshots += 1;
    });

    source.createNode({
      body: '',
      color: 'mint',
      position: { x: 40, y: 60 },
      title: 'Remote node',
    });
    Y.applyUpdate(targetYDocument, Y.encodeStateAsUpdate(sourceYDocument));

    expect(target.getSnapshot().nodes).toEqual([
      {
        id: source.getSnapshot().nodes[0]?.id,
        body: '',
        color: 'mint',
        position: { x: 40, y: 60 },
        title: 'Remote node',
      },
    ]);
    expect(publishedSnapshots).toBe(1);

    unsubscribe();
    source.destroy();
    target.destroy();
  });

  it('updates Node content and position as durable fields', () => {
    const document = new CanvasDocument(new Y.Doc());
    const nodeId = document.createNode({
      body: '',
      color: 'sand',
      position: { x: 0, y: 0 },
      title: 'Draft',
    });

    document.updateNode(nodeId, {
      body: 'The shared source of truth.',
      color: 'rose',
      title: 'Canvas document',
    });
    document.moveNode(nodeId, { x: 240, y: 180 });

    expect(document.getSnapshot().nodes[0]).toEqual({
      id: nodeId,
      body: 'The shared source of truth.',
      color: 'rose',
      position: { x: 240, y: 180 },
      title: 'Canvas document',
    });
    document.destroy();
  });

  it('creates at most one directed Connection for the same Node pair', () => {
    const document = new CanvasDocument(new Y.Doc());
    const source = document.createNode({
      body: '',
      color: 'sky',
      position: { x: 0, y: 0 },
      title: 'Source',
    });
    const target = document.createNode({
      body: '',
      color: 'mint',
      position: { x: 300, y: 0 },
      title: 'Target',
    });

    const firstConnectionId = document.connectNodes(source, target);
    const repeatedConnectionId = document.connectNodes(source, target);

    expect(repeatedConnectionId).toBe(firstConnectionId);
    expect(document.getSnapshot().connections).toEqual([{ id: firstConnectionId, source, target }]);
    expect(() => document.connectNodes(source, source)).toThrow('A Node cannot connect to itself');
    document.destroy();
  });

  it('publishes a Connection to a remote Canvas replica', () => {
    const sourceYDocument = new Y.Doc();
    const targetYDocument = new Y.Doc();
    sourceYDocument.on('update', (update) => Y.applyUpdate(targetYDocument, update, 'source'));
    const sourceDocument = new CanvasDocument(sourceYDocument);
    const targetDocument = new CanvasDocument(targetYDocument);
    const source = sourceDocument.createNode({
      body: '',
      color: 'sky',
      position: { x: 0, y: 0 },
      title: 'Source',
    });
    const target = sourceDocument.createNode({
      body: '',
      color: 'mint',
      position: { x: 300, y: 0 },
      title: 'Target',
    });

    const connectionId = sourceDocument.connectNodes(source, target);

    expect(targetDocument.getSnapshot().connections).toEqual([{ id: connectionId, source, target }]);
    sourceDocument.destroy();
    targetDocument.destroy();
  });

  it('deletes a Node and its incident Connections in one observable change', () => {
    const document = new CanvasDocument(new Y.Doc());
    const source = document.createNode({
      body: '',
      color: 'sky',
      position: { x: 0, y: 0 },
      title: 'Source',
    });
    const target = document.createNode({
      body: '',
      color: 'mint',
      position: { x: 300, y: 0 },
      title: 'Target',
    });
    document.connectNodes(source, target);
    let publishedSnapshots = 0;
    const unsubscribe = document.subscribe(() => {
      publishedSnapshots += 1;
    });

    document.deleteNode(target);

    expect(document.getSnapshot()).toEqual({
      connections: [],
      nodes: [expect.objectContaining({ id: source })],
    });
    expect(publishedSnapshots).toBe(1);
    expect(() => document.moveNode(target, { x: 10, y: 10 })).toThrow(`Node ${target} does not exist`);
    unsubscribe();
    document.destroy();
  });

  it('removes a Connection created concurrently with deletion of its target Node', () => {
    const seedYDocument = new Y.Doc();
    const seed = new CanvasDocument(seedYDocument);
    const source = seed.createNode({
      body: '',
      color: 'sky',
      position: { x: 0, y: 0 },
      title: 'Source',
    });
    const target = seed.createNode({
      body: '',
      color: 'mint',
      position: { x: 300, y: 0 },
      title: 'Target',
    });
    const seededState = Y.encodeStateAsUpdate(seedYDocument);
    const firstYDocument = new Y.Doc();
    const secondYDocument = new Y.Doc();
    Y.applyUpdate(firstYDocument, seededState);
    Y.applyUpdate(secondYDocument, seededState);
    const first = new CanvasDocument(firstYDocument);
    const second = new CanvasDocument(secondYDocument);

    first.deleteNode(target);
    second.connectNodes(source, target);
    const firstState = Y.encodeStateAsUpdate(firstYDocument);
    const secondState = Y.encodeStateAsUpdate(secondYDocument);
    Y.applyUpdate(firstYDocument, secondState);
    Y.applyUpdate(secondYDocument, firstState);

    expect(first.getSnapshot().connections).toEqual([]);
    expect(second.getSnapshot().connections).toEqual([]);
    expect(first.getSnapshot().nodes.map((node) => node.id)).toEqual([source]);
    expect(second.getSnapshot().nodes.map((node) => node.id)).toEqual([source]);
    seed.destroy();
    first.destroy();
    second.destroy();
  });

  it('undoes and redoes only the current Collaborator local transactions', () => {
    const firstYDocument = new Y.Doc();
    const secondYDocument = new Y.Doc();
    firstYDocument.on('update', (update) => Y.applyUpdate(secondYDocument, update, 'first'));
    secondYDocument.on('update', (update) => Y.applyUpdate(firstYDocument, update, 'second'));
    const first = new CanvasDocument(firstYDocument);
    const second = new CanvasDocument(secondYDocument);

    const firstNodeId = first.createNode({
      body: '',
      color: 'sky',
      position: { x: 0, y: 0 },
      title: 'First collaborator',
    });
    const secondNodeId = second.createNode({
      body: '',
      color: 'mint',
      position: { x: 300, y: 0 },
      title: 'Second collaborator',
    });

    first.undo();
    expect(first.getSnapshot().nodes.map((node) => node.id)).toEqual([secondNodeId]);
    expect(second.getSnapshot().nodes.map((node) => node.id)).toEqual([secondNodeId]);

    first.redo();
    expect(
      first
        .getSnapshot()
        .nodes.map((node) => node.id)
        .toSorted(),
    ).toEqual([firstNodeId, secondNodeId].toSorted());
    expect(
      second
        .getSnapshot()
        .nodes.map((node) => node.id)
        .toSorted(),
    ).toEqual([firstNodeId, secondNodeId].toSorted());
    first.destroy();
    second.destroy();
  });

  it('groups a continuous Node drag into one undo transaction', () => {
    const document = new CanvasDocument(new Y.Doc());
    const nodeId = document.createNode({
      body: '',
      color: 'sand',
      position: { x: 20, y: 30 },
      title: 'Movable',
    });

    document.beginGesture();
    document.moveNode(nodeId, { x: 80, y: 90 });
    document.moveNode(nodeId, { x: 140, y: 160 });
    document.endGesture();
    document.undo();

    expect(document.getSnapshot().nodes[0]?.position).toEqual({ x: 20, y: 30 });
    document.undo();
    expect(document.getSnapshot().nodes).toEqual([]);
    document.destroy();
  });

  it('deletes and restores a selected Connection through local history', () => {
    const document = new CanvasDocument(new Y.Doc());
    const source = document.createNode({
      body: '',
      color: 'sky',
      position: { x: 0, y: 0 },
      title: 'Source',
    });
    const target = document.createNode({
      body: '',
      color: 'mint',
      position: { x: 300, y: 0 },
      title: 'Target',
    });
    const connectionId = document.connectNodes(source, target);

    document.deleteConnection(connectionId);
    expect(document.getSnapshot().connections).toEqual([]);
    expect(document.canUndo()).toBe(true);

    document.undo();
    expect(document.getSnapshot().connections).toEqual([{ id: connectionId, source, target }]);
    expect(document.canRedo()).toBe(true);
    document.destroy();
  });

  it('surfaces an invalid remote Node instead of coercing its fields', () => {
    const yDocument = new Y.Doc();
    const invalidNode = new Y.Map<unknown>();
    invalidNode.set('position', { x: 0, y: 0 });
    yDocument.getMap<Y.Map<unknown>>('nodes').set('broken-node', invalidNode);

    expect(() => new CanvasDocument(yDocument)).toThrow('Node broken-node is invalid');
    yDocument.destroy();
  });
});
