import { describe, expect, it } from 'bun:test';

import { createCollaboratorProfile, loadCollaboratorProfile, saveCollaboratorProfile } from './collaborator-profile.ts';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe('Collaborator profile', () => {
  it('persists a versioned browser-local identity', () => {
    const storage = createStorage();
    const profile = createCollaboratorProfile('小周');

    expect(loadCollaboratorProfile(storage)).toBeNull();
    saveCollaboratorProfile(storage, profile);
    expect(loadCollaboratorProfile(storage)).toEqual(profile);
  });

  it('surfaces invalid stored identity data', () => {
    const storage = createStorage();
    storage.setItem('sync-canvas:collaborator:v1', '{"name":42}');

    expect(() => loadCollaboratorProfile(storage)).toThrow('Stored Collaborator profile is invalid');
  });
});
