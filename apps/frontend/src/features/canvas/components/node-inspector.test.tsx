import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { act, useCallback, useSyncExternalStore } from 'react';
import type { Root } from 'react-dom/client';

import { Window } from 'happy-dom';
import * as Y from 'yjs';

import { CanvasDocument } from '@/features/canvas/model/canvas-document.ts';

import { NodeInspector } from './node-inspector.tsx';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function InspectorHarness({ document, nodeId }: { document: CanvasDocument; nodeId: string }) {
  const subscribe = useCallback((listener: () => void) => document.subscribe(listener), [document]);
  const getSnapshot = useCallback(() => document.getSnapshot(), [document]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  return <NodeInspector document={document} editable node={snapshot.nodes.find((node) => node.id === nodeId)} />;
}

describe('NodeInspector', () => {
  let browserWindow: Window;
  let canvasDocument: CanvasDocument;
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    browserWindow = new Window();
    Object.assign(globalThis, {
      document: browserWindow.document,
      Event: browserWindow.Event,
      HTMLElement: browserWindow.HTMLElement,
      HTMLInputElement: browserWindow.HTMLInputElement,
      HTMLTextAreaElement: browserWindow.HTMLTextAreaElement,
      InputEvent: browserWindow.InputEvent,
      navigator: browserWindow.navigator,
      Node: browserWindow.Node,
      window: browserWindow,
    });
    const browserContainer = browserWindow.document.createElement('div');
    browserWindow.document.body.append(browserContainer);
    container = browserContainer as unknown as HTMLDivElement;
    canvasDocument = new CanvasDocument(new Y.Doc());
    const { createRoot } = await import('react-dom/client');
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    canvasDocument.destroy();
    browserWindow.close();
  });

  it('keeps title focus after the debounced Canvas update is published', async () => {
    const nodeId = canvasDocument.createNode({
      body: '',
      color: 'sand',
      position: { x: 0, y: 0 },
      title: 'Draft title',
    });
    await act(async () => root.render(<InspectorHarness document={canvasDocument} nodeId={nodeId} />));
    const titleInput = container.querySelector<HTMLInputElement>('input[name="nodeTitle"]');

    if (!titleInput) {
      throw new Error('Title input did not render');
    }
    titleInput.focus();
    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(browserWindow.HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(titleInput, 'Published title');
      titleInput.dispatchEvent(
        new browserWindow.InputEvent('input', {
          bubbles: true,
          data: 'Published title',
          inputType: 'insertText',
        }) as unknown as Event,
      );
      await Bun.sleep(300);
    });

    expect(canvasDocument.getSnapshot().nodes[0]?.title).toBe('Published title');
    expect(browserWindow.document.activeElement === (titleInput as unknown)).toBe(true);
  });

  it('keeps body focus after the debounced Canvas update is published', async () => {
    const nodeId = canvasDocument.createNode({
      body: 'Draft body',
      color: 'sand',
      position: { x: 0, y: 0 },
      title: 'Node title',
    });
    await act(async () => root.render(<InspectorHarness document={canvasDocument} nodeId={nodeId} />));
    const bodyInput = container.querySelector<HTMLTextAreaElement>('textarea[name="nodeBody"]');

    if (!bodyInput) {
      throw new Error('Body input did not render');
    }
    bodyInput.focus();
    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(browserWindow.HTMLTextAreaElement.prototype, 'value')?.set;
      valueSetter?.call(bodyInput, 'Published body');
      bodyInput.dispatchEvent(
        new browserWindow.InputEvent('input', {
          bubbles: true,
          data: 'Published body',
          inputType: 'insertText',
        }) as unknown as Event,
      );
      await Bun.sleep(300);
    });

    expect(canvasDocument.getSnapshot().nodes[0]?.body).toBe('Published body');
    expect(browserWindow.document.activeElement === (bodyInput as unknown)).toBe(true);
  });
});
