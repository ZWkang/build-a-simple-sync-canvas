# Use one Yjs document per canvas

Each Canvas owns one `Y.Doc` whose root shared types contain independently addressable node and connection records. The Canvas boundary therefore also defines collaboration-room loading, synchronization, and persistence, while a single Yjs transaction can still update related graph records atomically.
