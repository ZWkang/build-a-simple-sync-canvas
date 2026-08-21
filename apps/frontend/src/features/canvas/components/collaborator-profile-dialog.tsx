import { useState, type FormEvent, type ReactElement } from 'react';
import { UserRoundIcon } from 'lucide-react';

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
import {
  createCollaboratorProfile,
  type CollaboratorProfile,
} from '@/features/canvas/collaboration/collaborator-profile.ts';

interface CollaboratorProfileDialogProps {
  onSave(profile: CollaboratorProfile): void;
  profile: CollaboratorProfile | null;
  trigger?: ReactElement;
}

export function CollaboratorProfileDialog({ onSave, profile, trigger }: CollaboratorProfileDialogProps) {
  const required = profile === null;
  const [open, setOpen] = useState(required);
  const [name, setName] = useState(profile?.name ?? '');

  function handleOpenChange(nextOpen: boolean) {
    if (!required || nextOpen) {
      setOpen(nextOpen);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextProfile = profile ? { ...profile, name: name.trim() } : createCollaboratorProfile(name);
    onSave(nextProfile);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent showCloseButton={!required}>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{required ? '加入协作画布' : '编辑协作者身份'}</DialogTitle>
            <DialogDescription>
              显示名和颜色只保存在当前浏览器，并通过 Presence 告诉其他协作者你是谁。
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="collaborator-name">显示名</FieldLabel>
              <Input
                id="collaborator-name"
                autoFocus
                autoComplete="off"
                name="collaboratorName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="输入你的名字"
                required
              />
              <FieldDescription>其他协作者会在鼠标指针和头像上看到这个名称。</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            {!required ? (
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
            ) : null}
            <Button type="submit" disabled={name.trim().length === 0}>
              <UserRoundIcon data-icon="inline-start" />
              {required ? '进入 Canvas' : '保存身份'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
