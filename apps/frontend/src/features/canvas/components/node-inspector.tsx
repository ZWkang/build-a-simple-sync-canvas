import { useEffect, useRef } from 'react';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty.tsx';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx';
import { MousePointerSquareDashedIcon } from 'lucide-react';
import {
  nodeColors,
  type CanvasDocument,
  type CanvasNode,
  type NodeColor,
} from '@/features/canvas/model/canvas-document.ts';

const colorLabels: Record<NodeColor, string> = {
  sand: '沙色',
  sky: '天蓝',
  mint: '薄荷',
  rose: '玫瑰',
};

interface NodeInspectorProps {
  document: CanvasDocument;
  editable: boolean;
  node: CanvasNode | undefined;
}

export function NodeInspector({ document, editable, node }: NodeInspectorProps) {
  if (!node) {
    return (
      <Empty className="h-full rounded-none border-0 px-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MousePointerSquareDashedIcon />
          </EmptyMedia>
          <EmptyTitle>选择一个节点</EmptyTitle>
          <EmptyDescription>在这里编辑标题、正文和颜色。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <SelectedNodeInspector key={node.id} document={document} editable={editable} node={node} />;
}

interface SelectedNodeInspectorProps {
  document: CanvasDocument;
  editable: boolean;
  node: CanvasNode;
}

function SelectedNodeInspector({ document, editable, node }: SelectedNodeInspectorProps) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const editableRef = useRef(editable);
  editableRef.current = editable;

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!editable) {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    }
  }, [editable]);

  function schedule(field: 'body' | 'title', value: string) {
    const activeTimer = timers.current.get(field);
    if (activeTimer) {
      clearTimeout(activeTimer);
    }
    timers.current.set(
      field,
      setTimeout(() => {
        if (editableRef.current) {
          document.updateNode(node.id, { [field]: value });
        }
        timers.current.delete(field);
      }, 250),
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <div>
        <p className="text-sm font-medium">节点属性</p>
        <p className="mt-1 text-xs text-muted-foreground">字段会在停止输入后同步给协作者。</p>
      </div>
      <FieldGroup>
        <Field data-disabled={!editable}>
          <FieldLabel htmlFor={`node-title-${node.id}`}>标题</FieldLabel>
          <Input
            key={`${node.id}:${node.title}`}
            id={`node-title-${node.id}`}
            autoComplete="off"
            defaultValue={node.title}
            disabled={!editable}
            name="nodeTitle"
            onChange={(event) => schedule('title', event.target.value)}
          />
        </Field>
        <Field data-disabled={!editable}>
          <FieldLabel htmlFor={`node-body-${node.id}`}>正文</FieldLabel>
          <Textarea
            key={`${node.id}:${node.body}`}
            id={`node-body-${node.id}`}
            autoComplete="off"
            defaultValue={node.body}
            disabled={!editable}
            name="nodeBody"
            onChange={(event) => schedule('body', event.target.value)}
            placeholder="补充节点说明…"
          />
          <FieldDescription>正文按整个字段同步，不进行字符级合并。</FieldDescription>
        </Field>
        <Field data-disabled={!editable}>
          <FieldLabel id={`node-color-${node.id}`}>颜色</FieldLabel>
          <ToggleGroup
            aria-labelledby={`node-color-${node.id}`}
            disabled={!editable}
            value={[node.color]}
            onValueChange={(values) => {
              const color = values[0] as NodeColor | undefined;
              if (color && nodeColors.includes(color)) {
                document.updateNode(node.id, { color });
              }
            }}
            variant="outline"
          >
            {nodeColors.map((color) => (
              <ToggleGroupItem key={color} value={color} aria-label={colorLabels[color]}>
                <span className="node-color-swatch" data-color={color} />
                <span className="sr-only">{colorLabels[color]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </FieldGroup>
    </div>
  );
}
