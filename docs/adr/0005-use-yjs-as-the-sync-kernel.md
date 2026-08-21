# Use Yjs as the sync kernel

Canvas content and concurrent merge semantics use Yjs, while React Flow remains the graph projection and interaction layer. The application still owns the canvas domain schema, validation, transport integration, durable persistence, and recovery.

## Considered Options

A server-sequenced operation protocol remains an alternative that may be prototyped and evaluated later. It is not a second production path or an automatic runtime fallback for the Yjs implementation.
