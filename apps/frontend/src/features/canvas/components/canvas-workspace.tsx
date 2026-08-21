import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ViewportPortal,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  ScanIcon,
  MousePointer2Icon,
  NetworkIcon,
  PlusIcon,
  Redo2Icon,
  Trash2Icon,
  Undo2Icon,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import {
  type CollaborationStatus,
  CanvasCollaborationSession,
} from '@/features/canvas/collaboration/canvas-collaboration-session.ts';
import type { CollaboratorPresence } from '@/features/canvas/collaboration/collaborator-presence.ts';
import {
  saveCollaboratorProfile,
  type CollaboratorProfile,
} from '@/features/canvas/collaboration/collaborator-profile.ts';
import type { CanvasRecord } from '@/features/canvases/api.ts';

import { CollaboratorProfileDialog } from './collaborator-profile-dialog.tsx';
import { KnowledgeNode, type KnowledgeFlowNode } from './knowledge-node.tsx';
import { NodeInspector } from './node-inspector.tsx';

const nodeTypes = { knowledge: KnowledgeNode };

const statusLabels: Record<CollaborationStatus, string> = {
  connecting: '正在连接',
  deleted: '已删除',
  disconnected: '已断线',
  error: '连接错误',
  reconnecting: '正在重连',
  synced: '已同步',
};

interface CanvasWorkspaceProps {
  canvas: CanvasRecord;
  initialProfile: CollaboratorProfile;
}

export function CanvasWorkspace({ canvas, initialProfile }: CanvasWorkspaceProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [session, setSession] = useState<CanvasCollaborationSession | null>(null);

  useEffect(() => {
    const activeSession = new CanvasCollaborationSession(canvas.id, profile);
    setSession(activeSession);
    return () => {
      activeSession.destroy();
    };
  }, [canvas.id]);

  function handleProfileSave(nextProfile: CollaboratorProfile) {
    saveCollaboratorProfile(window.localStorage, nextProfile);
    setProfile(nextProfile);
    session?.setProfile(nextProfile);
  }

  if (!session) {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">正在初始化协同会话…</div>;
  }

  return (
    <ActiveCanvasWorkspace canvas={canvas} profile={profile} session={session} onProfileSave={handleProfileSave} />
  );
}

interface ActiveCanvasWorkspaceProps {
  canvas: CanvasRecord;
  onProfileSave(profile: CollaboratorProfile): void;
  profile: CollaboratorProfile;
  session: CanvasCollaborationSession;
}

function ActiveCanvasWorkspace({ canvas, onProfileSave, profile, session }: ActiveCanvasWorkspaceProps) {
  const collaborationSubscribe = useCallback((listener: () => void) => session.subscribe(listener), [session]);
  const collaborationGetSnapshot = useCallback(() => session.getSnapshot(), [session]);
  const documentSubscribe = useCallback((listener: () => void) => session.canvas.subscribe(listener), [session]);
  const documentGetSnapshot = useCallback(() => session.canvas.getSnapshot(), [session]);
  const collaboration = useSyncExternalStore(collaborationSubscribe, collaborationGetSnapshot);
  const canvasSnapshot = useSyncExternalStore(documentSubscribe, documentGetSnapshot);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const flowRef = useRef<ReactFlowInstance<KnowledgeFlowNode, Edge> | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const moveFrameRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ id: string; position: { x: number; y: number } } | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const activeDragRef = useRef<string | null>(null);
  const editable = collaboration.status === 'synced';
  const remoteCollaborators = useMemo(
    () => collaboration.collaborators.filter((presence) => !presence.isLocal),
    [collaboration.collaborators],
  );
  const remoteNodeCollaborators = useMemo(
    () => collaboration.nodeCollaborators.filter((presence) => !presence.isLocal),
    [collaboration.nodeCollaborators],
  );
  const selectedNode = canvasSnapshot.nodes.find((node) => node.id === selectedNodeId);

  useEffect(() => {
    if (selectedNodeId && !canvasSnapshot.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
      session.setSelectedNode(null);
    }
  }, [canvasSnapshot.nodes, selectedNodeId, session]);

  useEffect(() => {
    return () => {
      if (moveFrameRef.current !== null) {
        cancelAnimationFrame(moveFrameRef.current);
      }
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
      }
      session.setPointer(null);
      session.setDragClaim(null);
    };
  }, [session]);

  const projectedNodes = useMemo<KnowledgeFlowNode[]>(() => {
    return canvasSnapshot.nodes.map((node) => {
      const remoteSelections = remoteNodeCollaborators.filter((presence) => presence.selectedNodeId === node.id);
      const claimedBy = remoteNodeCollaborators.find((presence) => presence.dragClaimNodeId === node.id) ?? null;
      return {
        id: node.id,
        type: 'knowledge',
        position: node.position,
        draggable: editable && claimedBy === null,
        data: { claimedBy, node, remoteSelections },
      };
    });
  }, [canvasSnapshot.nodes, editable, remoteNodeCollaborators]);

  const projectedEdges = useMemo<Edge[]>(
    () =>
      canvasSnapshot.connections.map((connection) => ({
        id: connection.id,
        source: connection.source,
        target: connection.target,
      })),
    [canvasSnapshot.connections],
  );
  const [flowNodes, setFlowNodes, applyNodeChanges] = useNodesState<KnowledgeFlowNode>(projectedNodes);
  const [flowEdges, setFlowEdges, applyEdgeChanges] = useEdgesState<Edge>(projectedEdges);

  useEffect(() => {
    setFlowNodes((currentNodes) => {
      const currentById = new Map(currentNodes.map((node) => [node.id, node]));
      return projectedNodes.map((node) => ({ ...currentById.get(node.id), ...node }));
    });
  }, [projectedNodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges((currentEdges) => {
      const currentById = new Map(currentEdges.map((edge) => [edge.id, edge]));
      return projectedEdges.map((edge) => ({ ...currentById.get(edge.id), ...edge }));
    });
  }, [projectedEdges, setFlowEdges]);

  const handleNodeChanges = useCallback(
    (changes: NodeChange<KnowledgeFlowNode>[]) => {
      const allowedChanges =
        session.getSnapshot().status === 'synced'
          ? changes
          : changes.filter((change) => change.type === 'dimensions' || change.type === 'select');
      applyNodeChanges(allowedChanges);
    },
    [applyNodeChanges, session],
  );

  const handleEdgeChanges = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const allowedChanges =
        session.getSnapshot().status === 'synced' ? changes : changes.filter((change) => change.type === 'select');
      applyEdgeChanges(allowedChanges);
    },
    [applyEdgeChanges, session],
  );

  function createNode(position?: { x: number; y: number }) {
    if (!editable) {
      return;
    }

    let nodePosition = position;
    if (!nodePosition) {
      const bounds = canvasContainerRef.current?.getBoundingClientRect();
      const flow = flowRef.current;
      if (!bounds || !flow) {
        throw new Error('Canvas viewport is not ready');
      }
      nodePosition = flow.screenToFlowPosition({
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      });
    }

    const nodeId = session.canvas.createNode({
      body: '',
      color: 'sand',
      position: nodePosition,
      title: '未命名节点',
    });
    setSelectedConnectionId(null);
    setSelectedNodeId(nodeId);
    session.setSelectedNode(nodeId);
  }

  function scheduleMove(node: KnowledgeFlowNode) {
    pendingMoveRef.current = { id: node.id, position: node.position };
    if (moveFrameRef.current !== null) {
      return;
    }

    moveFrameRef.current = requestAnimationFrame(() => {
      moveFrameRef.current = null;
      const pendingMove = pendingMoveRef.current;
      pendingMoveRef.current = null;
      if (
        pendingMove &&
        session.getSnapshot().status === 'synced' &&
        session.canvas.getSnapshot().nodes.some((item) => item.id === pendingMove.id)
      ) {
        session.canvas.moveNode(pendingMove.id, pendingMove.position);
      }
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const flow = flowRef.current;
    if (!flow) {
      return;
    }

    pendingPointerRef.current = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    if (pointerFrameRef.current !== null) {
      return;
    }

    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      session.setPointer(pendingPointerRef.current);
    });
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setShareError(null);
    } catch (error) {
      setShareError(`复制链接失败：${String(error)}`);
    }
  }

  function deleteSelection() {
    if (!editable) {
      return;
    }

    if (selectedNodeId) {
      session.canvas.deleteNode(selectedNodeId);
      setSelectedNodeId(null);
      session.setSelectedNode(null);
      return;
    }

    if (selectedConnectionId) {
      session.canvas.deleteConnection(selectedConnectionId);
      setSelectedConnectionId(null);
    }
  }

  return (
    <main id="main-content" className="flex h-dvh min-w-[960px] flex-col overflow-hidden bg-background" tabIndex={-1}>
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <a href="/" className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })} aria-label="返回 Canvas 列表">
            <ArrowLeftIcon />
          </a>
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <NetworkIcon aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium">{canvas.title}</h1>
            <p className="text-xs text-muted-foreground">实时协作节点图</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge aria-live="polite" variant={collaboration.status === 'synced' ? 'secondary' : 'outline'}>
            {statusLabels[collaboration.status]}
          </Badge>
          <AvatarGroup aria-label="当前协作者">
            {collaboration.collaborators.map((presence) => (
              <Tooltip key={presence.clientId}>
                <TooltipTrigger render={<Avatar size="sm" style={{ outlineColor: presence.profile.color }} />}>
                  <AvatarFallback style={{ backgroundColor: presence.profile.color, color: 'white' }}>
                    {presence.profile.name.slice(0, 1)}
                  </AvatarFallback>
                </TooltipTrigger>
                <TooltipContent>
                  {presence.profile.name}
                  {presence.isLocal ? '（你）' : ''}
                </TooltipContent>
              </Tooltip>
            ))}
          </AvatarGroup>
          <CollaboratorProfileDialog
            profile={profile}
            onSave={onProfileSave}
            trigger={
              <Button variant="ghost" size="sm">
                {profile.name}
              </Button>
            }
          />
          <Button aria-live="polite" variant="outline" size="sm" onClick={copyShareLink}>
            {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
            {copied ? '已复制' : '分享链接'}
          </Button>
        </div>
      </header>

      {shareError ? (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <AlertTitle>无法复制分享链接</AlertTitle>
          <AlertDescription>{shareError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r py-3" aria-label="画布工具栏">
          <CanvasTool label="创建节点" onClick={() => createNode()} disabled={!editable}>
            <PlusIcon />
          </CanvasTool>
          <CanvasTool label="适应视图" onClick={() => void flowRef.current?.fitView({ duration: 180, padding: 0.2 })}>
            <ScanIcon />
          </CanvasTool>
          <Separator className="my-1 w-7" />
          <CanvasTool
            label="撤销"
            onClick={() => session.canvas.undo()}
            disabled={!editable || !session.canvas.canUndo()}
          >
            <Undo2Icon />
          </CanvasTool>
          <CanvasTool
            label="重做"
            onClick={() => session.canvas.redo()}
            disabled={!editable || !session.canvas.canRedo()}
          >
            <Redo2Icon />
          </CanvasTool>
          <CanvasTool
            label="删除所选"
            onClick={deleteSelection}
            disabled={!editable || (!selectedNodeId && !selectedConnectionId)}
          >
            <Trash2Icon />
          </CanvasTool>
        </aside>

        <div
          ref={canvasContainerRef}
          className="relative min-w-0 flex-1"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => session.setPointer(null)}
        >
          <ReactFlow<KnowledgeFlowNode, Edge>
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodeChanges}
            onEdgesChange={handleEdgeChanges}
            onInit={(instance) => {
              flowRef.current = instance;
            }}
            onConnect={(connection: Connection) => {
              if (session.getSnapshot().status === 'synced' && connection.source && connection.target) {
                try {
                  session.canvas.connectNodes(connection.source, connection.target);
                  setConnectionError(null);
                } catch (error) {
                  setConnectionError(`无法创建 Connection：${String(error)}`);
                }
              }
            }}
            onConnectEnd={(_event, connectionState) => {
              if (connectionState.fromNode && connectionState.isValid !== true) {
                setConnectionError('Connection 未创建。请将线段释放到目标节点圆点，或依次点击起点和终点圆点。');
              }
            }}
            onNodeClick={(_event, node) => {
              setSelectedNodeId(node.id);
              setSelectedConnectionId(null);
              session.setSelectedNode(node.id);
            }}
            onEdgeClick={(_event, edge) => {
              setSelectedNodeId(null);
              setSelectedConnectionId(edge.id);
              session.setSelectedNode(null);
            }}
            onNodeDragStart={(_event, node) => {
              activeDragRef.current = node.id;
              session.canvas.beginGesture();
              session.setDragClaim(node.id);
            }}
            onNodeDrag={(_event, node) => scheduleMove(node)}
            onNodeDragStop={(_event, node) => {
              if (moveFrameRef.current !== null) {
                cancelAnimationFrame(moveFrameRef.current);
                moveFrameRef.current = null;
              }
              pendingMoveRef.current = null;
              if (
                session.getSnapshot().status === 'synced' &&
                session.canvas.getSnapshot().nodes.some((item) => item.id === node.id)
              ) {
                session.canvas.moveNode(node.id, node.position);
              }
              if (activeDragRef.current) {
                session.canvas.endGesture();
                activeDragRef.current = null;
              }
              session.setDragClaim(null);
            }}
            onDelete={({ nodes, edges }) => {
              if (session.getSnapshot().status !== 'synced') {
                return;
              }

              nodes.forEach((node) => session.canvas.deleteNode(node.id));
              edges.forEach((edge) => session.canvas.deleteConnection(edge.id));
            }}
            onDoubleClick={(event) => {
              const flow = flowRef.current;
              if (editable && flow && (event.target as Element).classList.contains('react-flow__pane')) {
                createNode(flow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
              }
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedConnectionId(null);
              session.setSelectedNode(null);
            }}
            nodesConnectable={editable}
            nodesDraggable={editable}
            connectOnClick
            connectionRadius={32}
            elementsSelectable
            multiSelectionKeyCode={null}
            fitView
            minZoom={0.25}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.25} />
            <MiniMap pannable zoomable />
            <Controls showInteractive={false} />
            <ViewportPortal>
              {remoteCollaborators.map((presence) =>
                presence.pointer ? <RemotePointer key={presence.clientId} presence={presence} /> : null,
              )}
            </ViewportPortal>
          </ReactFlow>

          {collaboration.status !== 'synced' ? (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
              <Alert
                className="pointer-events-auto max-w-md"
                variant={collaboration.status === 'error' ? 'destructive' : 'default'}
              >
                <AlertTitle>{statusLabels[collaboration.status]}</AlertTitle>
                <AlertDescription>
                  {collaboration.status === 'deleted' ? (
                    <a href="/">Canvas 已被删除，返回首页。</a>
                  ) : collaboration.error ? (
                    collaboration.error
                  ) : (
                    '画布保持可见但暂时只读；同步完成后会自动恢复编辑。'
                  )}
                </AlertDescription>
              </Alert>
            </div>
          ) : null}

          {connectionError ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
              <Alert className="pointer-events-auto max-w-lg" variant="destructive">
                <AlertTitle>连接没有建立</AlertTitle>
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </div>

        <aside className="w-80 shrink-0 border-l bg-card" aria-label="节点属性">
          <NodeInspector document={session.canvas} editable={editable} node={selectedNode} />
        </aside>
      </div>
    </main>
  );
}

interface CanvasToolProps {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick(): void;
}

function CanvasTool({ children, disabled, label, onClick }: CanvasToolProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon" aria-label={label} disabled={disabled} onClick={onClick} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function RemotePointer({ presence }: { presence: CollaboratorPresence }) {
  if (!presence.pointer) {
    return null;
  }

  return (
    <div
      className="remote-pointer pointer-events-none absolute flex items-start gap-1"
      style={{
        transform: `translate(${presence.pointer.x}px, ${presence.pointer.y}px)`,
        color: presence.profile.color,
      }}
    >
      <MousePointer2Icon fill="currentColor" />
      <span
        className="max-w-40 truncate rounded-md px-2 py-1 text-xs font-medium text-white"
        style={{ backgroundColor: presence.profile.color }}
      >
        {presence.profile.name}
      </span>
    </div>
  );
}
