import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { LockKeyholeIcon } from 'lucide-react';

import type { CollaboratorPresence } from '@/features/canvas/collaboration/collaborator-presence.ts';
import type { CanvasNode } from '@/features/canvas/model/canvas-document.ts';
import { cn } from '@/lib/utils.ts';

export type KnowledgeFlowNode = Node<
  {
    claimedBy: CollaboratorPresence | null;
    node: CanvasNode;
    remoteSelections: CollaboratorPresence[];
  },
  'knowledge'
>;

export function KnowledgeNode({ data, selected }: NodeProps<KnowledgeFlowNode>) {
  const remoteSelection = data.remoteSelections[0];

  return (
    <div
      className={cn('knowledge-node', selected ? 'knowledge-node--selected' : undefined)}
      data-color={data.node.color}
      style={remoteSelection ? ({ '--remote-color': remoteSelection.profile.color } as React.CSSProperties) : undefined}
      aria-label={`节点：${data.node.title}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{data.node.title || '未命名节点'}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{data.node.body || '暂无正文'}</p>
        </div>
        {data.claimedBy ? <LockKeyholeIcon aria-label={`${data.claimedBy.profile.name} 正在拖动`} /> : null}
      </div>
      {remoteSelection ? (
        <span className="knowledge-node__collaborator" style={{ backgroundColor: remoteSelection.profile.color }}>
          {remoteSelection.profile.name}
        </span>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
