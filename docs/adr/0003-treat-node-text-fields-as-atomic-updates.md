# Treat node text fields as atomic updates

Titles and bodies synchronize as whole-field updates after a short input debounce, with concurrent updates resolved in a deterministic order. The first product slice deliberately does not merge character-level edits, because its collaborative unit is a node graph rather than a multiplayer text document.
