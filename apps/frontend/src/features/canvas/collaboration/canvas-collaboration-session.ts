import { HocuspocusProvider, HocuspocusProviderWebsocket, WebSocketStatus } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { z } from 'zod';

import { getCollaborationUrl } from '@/features/canvases/api.ts';
import { CanvasDocument, type Point } from '@/features/canvas/model/canvas-document.ts';

import { collaboratorColors, type CollaboratorProfile } from './collaborator-profile.ts';
import { uniqueCollaboratorsByProfile, type CollaboratorPresence } from './collaborator-presence.ts';

const presenceProfileSchema = z.object({
  color: z.enum(collaboratorColors),
  id: z.string().uuid(),
  name: z.string().min(1),
});

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const deletionMessageSchema = z.object({ type: z.literal('canvas-deleted') });

export type CollaborationStatus = 'connecting' | 'deleted' | 'disconnected' | 'error' | 'reconnecting' | 'synced';

export interface CollaborationSnapshot {
  collaborators: CollaboratorPresence[];
  error: string | null;
  nodeCollaborators: CollaboratorPresence[];
  status: CollaborationStatus;
}

export class CanvasCollaborationSession {
  public readonly canvas: CanvasDocument;
  private readonly listeners = new Set<() => void>();
  private readonly provider: HocuspocusProvider;
  private readonly websocketProvider: HocuspocusProviderWebsocket;
  private everSynced = false;
  private localDragClaimNodeId: string | null = null;
  private localPointer: Point | null = null;
  private localProfile: CollaboratorProfile;
  private localSelectedNodeId: string | null = null;
  private snapshot: CollaborationSnapshot = {
    collaborators: [],
    error: null,
    nodeCollaborators: [],
    status: 'connecting',
  };

  public constructor(canvasId: string, profile: CollaboratorProfile) {
    this.localProfile = profile;
    const yDocument = new Y.Doc();
    this.canvas = new CanvasDocument(yDocument);
    this.websocketProvider = new HocuspocusProviderWebsocket({
      autoConnect: false,
      url: getCollaborationUrl(),
    });
    this.provider = new HocuspocusProvider({
      document: yDocument,
      flushDelay: 16,
      name: canvasId,
      websocketProvider: this.websocketProvider,
      onAuthenticationFailed: ({ reason }) => this.fail(`协同连接被拒绝：${reason}`),
      onAwarenessChange: () => this.publishPresence(),
      onDisconnect: () => this.setStatus('disconnected'),
      onStateless: ({ payload }) => this.handleStateless(payload),
      onStatus: ({ status }) => this.handleStatus(status),
      onSynced: ({ state }) => {
        if (state) {
          this.everSynced = true;
          this.setStatus('synced');
        }
      },
    });
    this.provider.setAwarenessField('collaborator', profile);
    this.provider.setAwarenessField('dragClaimNodeId', null);
    this.provider.setAwarenessField('pointer', null);
    this.provider.setAwarenessField('selectedNodeId', null);
    this.publishPresence();
    this.provider.attach();
    this.websocketProvider.connect().catch((error: unknown) => {
      this.fail(`无法建立协同连接：${String(error)}`);
    });
  }

  public getSnapshot(): CollaborationSnapshot {
    return this.snapshot;
  }

  public setDragClaim(nodeId: string | null): void {
    if (this.localDragClaimNodeId === nodeId) {
      return;
    }

    this.localDragClaimNodeId = nodeId;
    this.provider.setAwarenessField('dragClaimNodeId', nodeId);
  }

  public setPointer(pointer: Point | null): void {
    if (
      this.localPointer === pointer ||
      (this.localPointer !== null &&
        pointer !== null &&
        this.localPointer.x === pointer.x &&
        this.localPointer.y === pointer.y)
    ) {
      return;
    }

    this.localPointer = pointer;
    this.provider.setAwarenessField('pointer', pointer);
  }

  public setProfile(profile: CollaboratorProfile): void {
    if (
      this.localProfile.id === profile.id &&
      this.localProfile.name === profile.name &&
      this.localProfile.color === profile.color
    ) {
      return;
    }

    this.localProfile = profile;
    this.provider.setAwarenessField('collaborator', profile);
    this.publishPresence();
  }

  public setSelectedNode(nodeId: string | null): void {
    if (this.localSelectedNodeId === nodeId) {
      return;
    }

    this.localSelectedNodeId = nodeId;
    this.provider.setAwarenessField('selectedNodeId', nodeId);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    this.provider.destroy();
    this.websocketProvider.destroy();
    this.canvas.destroy();
    this.listeners.clear();
  }

  private fail(message: string): void {
    this.snapshot = { ...this.snapshot, error: message, status: 'error' };
    this.publish();
  }

  private handleStateless(payload: string): void {
    let message: unknown;

    try {
      message = JSON.parse(payload);
    } catch (error) {
      this.fail(`协同服务返回了无效事件：${String(error)}`);
      return;
    }

    const deletionMessage = deletionMessageSchema.safeParse(message);
    if (!deletionMessage.success) {
      this.fail('协同服务返回了未知事件');
      return;
    }

    this.snapshot = { ...this.snapshot, status: 'deleted' };
    this.publish();
    this.provider.destroy();
  }

  private handleStatus(status: WebSocketStatus): void {
    if (this.snapshot.status === 'deleted' || this.snapshot.status === 'error') {
      return;
    }

    if (status === WebSocketStatus.Connected) {
      this.setStatus(this.everSynced ? 'reconnecting' : 'connecting');
      return;
    }

    if (status === WebSocketStatus.Connecting) {
      this.setStatus(this.everSynced ? 'reconnecting' : 'connecting');
      return;
    }

    this.setStatus('disconnected');
  }

  private publishPresence(): void {
    const awareness = this.provider.awareness;

    if (!awareness) {
      return;
    }

    try {
      const collaborators = uniqueCollaboratorsByProfile(
        Array.from(awareness.getStates(), ([clientId, state]) => {
          if (state.collaborator === undefined) {
            return null;
          }

          const profile = presenceProfileSchema.parse(state.collaborator);
          const pointer =
            state.pointer === null || state.pointer === undefined ? null : pointSchema.parse(state.pointer);
          return {
            clientId,
            dragClaimNodeId: typeof state.dragClaimNodeId === 'string' ? state.dragClaimNodeId : null,
            isLocal: clientId === awareness.clientID,
            pointer,
            profile,
            selectedNodeId: typeof state.selectedNodeId === 'string' ? state.selectedNodeId : null,
          } satisfies CollaboratorPresence;
        }).filter((presence): presence is CollaboratorPresence => presence !== null),
      );
      const nodeCollaborators = collaborators.map((presence) => ({ ...presence, pointer: null }));
      const nextNodeSignature = this.nodePresenceSignature(nodeCollaborators);
      const previousNodeCollaborators = this.snapshot.nodeCollaborators;

      this.snapshot = {
        ...this.snapshot,
        collaborators,
        nodeCollaborators:
          nextNodeSignature === this.nodePresenceSignature(previousNodeCollaborators)
            ? previousNodeCollaborators
            : nodeCollaborators,
      };
      this.publish();
    } catch (error) {
      this.fail(`协作者 Presence 无效：${String(error)}`);
    }
  }

  private setStatus(status: CollaborationStatus): void {
    if (this.snapshot.status === status) {
      return;
    }

    this.snapshot = { ...this.snapshot, status };
    this.publish();
  }

  private publish(): void {
    this.listeners.forEach((listener) => listener());
  }

  private nodePresenceSignature(collaborators: CollaboratorPresence[]): string {
    return collaborators
      .map(
        (presence) =>
          `${presence.clientId}:${presence.profile.id}:${presence.profile.name}:${presence.profile.color}:${presence.selectedNodeId ?? ''}:${presence.dragClaimNodeId ?? ''}`,
      )
      .sort()
      .join('|');
  }
}
