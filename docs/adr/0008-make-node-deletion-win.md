# Make node deletion win

Deleting a Node also deletes all of its Connections in the same Yjs transaction, and concurrent late edits or moves do not resurrect it. This gives node lifecycle conflicts one deterministic result and prevents connections from referring to missing nodes.
