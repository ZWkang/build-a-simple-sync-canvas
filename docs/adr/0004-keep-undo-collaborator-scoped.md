# Keep undo collaborator-scoped

Undo reverses the current collaborator's latest locally tracked durable transaction without reversing another collaborator's work, and redo reapplies only that collaborator's reverted transaction. Both histories belong to the current page session and are cleared when the canvas is refreshed or reopened. This avoids both the surprising behavior of a global history and the complexity of persisting private interaction history as shared canvas data.
