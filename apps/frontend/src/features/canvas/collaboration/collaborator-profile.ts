import { z } from 'zod';

export const collaboratorColors = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#059669', '#d97706'] as const;

const storageKey = 'sync-canvas:collaborator:v1';

const collaboratorProfileSchema = z.object({
  color: z.enum(collaboratorColors),
  id: z.string().uuid(),
  name: z.string().trim().min(1),
});

export type CollaboratorProfile = z.infer<typeof collaboratorProfileSchema>;

type ProfileStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createCollaboratorProfile(name: string): CollaboratorProfile {
  const id = crypto.randomUUID();
  const color = collaboratorColors[Number.parseInt(id.slice(0, 8), 16) % collaboratorColors.length];

  return collaboratorProfileSchema.parse({ color, id, name });
}

export function loadCollaboratorProfile(storage: ProfileStorage): CollaboratorProfile | null {
  let stored: string | null;

  try {
    stored = storage.getItem(storageKey);
  } catch (error) {
    throw new Error('Unable to read the Collaborator profile', { cause: error });
  }

  if (stored === null) {
    return null;
  }

  try {
    return collaboratorProfileSchema.parse(JSON.parse(stored));
  } catch (error) {
    throw new Error('Stored Collaborator profile is invalid', { cause: error });
  }
}

export function saveCollaboratorProfile(storage: ProfileStorage, profile: CollaboratorProfile): void {
  const parsedProfile = collaboratorProfileSchema.parse(profile);

  try {
    storage.setItem(storageKey, JSON.stringify(parsedProfile));
  } catch (error) {
    throw new Error('Unable to save the Collaborator profile', { cause: error });
  }
}
