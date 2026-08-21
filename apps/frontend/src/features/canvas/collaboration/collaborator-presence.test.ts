import { describe, expect, it } from 'bun:test';

import { uniqueCollaboratorsByProfile, type CollaboratorPresence } from './collaborator-presence.ts';

const aliceProfile = {
  color: '#2563eb' as const,
  id: '4f5e1f04-8d70-49df-ae70-c05ae7ef8f68',
  name: 'Alice',
};

function presence(clientId: number, overrides: Partial<CollaboratorPresence> = {}): CollaboratorPresence {
  return {
    clientId,
    dragClaimNodeId: null,
    isLocal: false,
    pointer: null,
    profile: aliceProfile,
    selectedNodeId: null,
    ...overrides,
  };
}

describe('Collaborator Presence identity', () => {
  it('keeps one Collaborator per stable profile and prefers the local session', () => {
    const bob = presence(40, {
      profile: {
        color: '#059669',
        id: '6c7e59f8-d757-453e-866b-a1bf0107aed9',
        name: 'Bob',
      },
    });

    const collaborators = uniqueCollaboratorsByProfile([
      presence(10, { pointer: { x: 10, y: 20 } }),
      presence(20, { isLocal: true, pointer: { x: 30, y: 40 } }),
      presence(30, { pointer: { x: 50, y: 60 } }),
      bob,
    ]);

    expect(collaborators).toEqual([presence(20, { isLocal: true, pointer: { x: 30, y: 40 } }), bob]);
  });

  it('uses the latest Awareness session when duplicate profiles are all remote', () => {
    expect(
      uniqueCollaboratorsByProfile([
        presence(10, { pointer: { x: 10, y: 20 } }),
        presence(30, { pointer: { x: 50, y: 60 } }),
      ]),
    ).toEqual([presence(30, { pointer: { x: 50, y: 60 } })]);
  });
});
