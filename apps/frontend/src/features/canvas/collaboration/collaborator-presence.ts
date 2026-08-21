import type { Point } from '@/features/canvas/model/canvas-document.ts';

import type { CollaboratorProfile } from './collaborator-profile.ts';

export interface CollaboratorPresence {
  clientId: number;
  dragClaimNodeId: string | null;
  isLocal: boolean;
  pointer: Point | null;
  profile: CollaboratorProfile;
  selectedNodeId: string | null;
}

export function uniqueCollaboratorsByProfile(presences: CollaboratorPresence[]): CollaboratorPresence[] {
  const collaborators = new Map<string, CollaboratorPresence>();

  for (const presence of presences) {
    const current = collaborators.get(presence.profile.id);

    if (current?.isLocal && !presence.isLocal) {
      continue;
    }

    collaborators.set(presence.profile.id, presence);
  }

  return Array.from(collaborators.values());
}
