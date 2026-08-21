# Sync Canvas

Sync Canvas is a shared node graph that multiple collaborators can edit together in real time.

## Canvas Content

**Canvas**:
A shared spatial document whose durable content consists of nodes and connections.
_Avoid_: Board, room

**Node**:
A titled, colored item with editable body text and an independent position on a canvas.
_Avoid_: Shape, card

**Connection**:
A durable, directed relationship between two distinct nodes on a canvas. A canvas contains at most one connection for the same ordered pair of nodes, and connections may form cycles.
_Avoid_: Edge, link

## Collaboration

**Collaborator**:
A participant, identified by a display name and color, currently editing a canvas with other participants.
_Avoid_: Member, account

**Presence**:
Ephemeral collaborator state that is visible to others, including the collaborator's pointer position and selected node.
_Avoid_: Cursor data, user state

**Drag Claim**:
A best-effort Presence signal that a Collaborator is currently dragging a Node. It discourages competing drags but is not an exclusive lock.
_Avoid_: Lock, ownership
