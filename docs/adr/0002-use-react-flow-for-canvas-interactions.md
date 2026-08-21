# Use React Flow for canvas interactions

The frontend uses `@xyflow/react` for graph rendering, selection, dragging, connecting, panning, and zooming, while the application owns the canvas document, persistence, and collaboration protocol. This keeps low-level interaction mechanics out of the product domain without delegating synchronization to a complete collaborative-canvas SDK.
