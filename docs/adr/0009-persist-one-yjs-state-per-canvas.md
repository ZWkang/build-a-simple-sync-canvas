# Persist one Yjs state per canvas

Canvas metadata remains relational, while each Canvas has one latest encoded Yjs binary state stored in SQLite and loaded or debounced-stored through the Hocuspocus persistence boundary. The first product slice does not append every update or duplicate nodes and connections into normalized SQL rows because it has no user-facing version-history requirement.
