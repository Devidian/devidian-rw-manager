# Live map layer WebSocket

The cross-repository objective, contract, migration, rollback, risks, and
validation checklist are maintained in `../../docs/active/live-player-position-sync.md`.

This repository owns one reconnecting subscription for the currently mounted
map/server and targeted REST reloads for invalidated map layers. Existing REST
polling remains the degraded fallback.
