import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field.tsx';
import { Input } from '@/components/ui/input.tsx';

interface CanvasFormDialogProps {
  description: string;
  initialTitle?: string;
  onSubmit(title: string): Promise<void>;
  submitLabel: string;
  title: string;
  trigger: ReactNode;
}

export function CanvasFormDialog({
  description,
  initialTitle = '',
  onSubmit,
  submitLabel,
  title,
  trigger,
}: CanvasFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState(initialTitle);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setCanvasTitle(initialTitle);
    }
  }, [initialTitle, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    try {
      await onSubmit(canvasTitle);
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${title}-canvas-title`}>Canvas 名称</FieldLabel>
              <Input
                id={`${title}-canvas-title`}
                autoFocus
                autoComplete="off"
                name="canvasTitle"
                value={canvasTitle}
                onChange={(event) => setCanvasTitle(event.target.value)}
                placeholder="例如：协同架构图"
                required
              />
              <FieldDescription>名称会显示在首页和协作工作区顶部。</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={pending || canvasTitle.trim().length === 0}>
              {pending ? '保存中…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
