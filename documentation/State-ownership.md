# State Ownership

This is the current state split before the P1 architecture refactor. Keep it updated when ownership changes.

## Server-owned state

- Socket.IO connections and room membership.
- Game ids and room ids.
- Player ids, names, slots, and ready flags.
- Game status: `waiting`, `readying`, `playing`, `abandoned`, or `closed`.
- Current scenario selection and `roundNumber`.
- High score table in server memory.

## Client-owned state

- Active screen and round phase.
- Canvas rendering and HUD rendering.
- Local player input state.
- Local simulation of players, bullets, collision, hits, obstacle damage, ammo, and match timer.
- In-match scores before they are submitted at game over.
- Audio state and sound playback.
- Touch control state and mobile camera state.
- Name editor interaction state.
- Stored player name in `localStorage`.

## UI rendering ownership

Component rendering ownership is defined in `documentation/UI-ownership.md`.
Canvas gameplay remains outside the component tree. Future components may own
DOM overlay markup, but screen-state decisions stay in `ClientScreens`, and
side effects stay in flow modules.

## Relayed state

- Key events are applied locally and relayed through the server to the opponent.
- Player positions are periodically sent through the server to the opponent.
- Obstacle damage events are produced by the shooter client and relayed to the opponent.
- Game results are submitted by the client at game over and recorded by the server for high scores.

## Current risk

Gameplay is mostly client-authoritative. This is acceptable for a small public arcade toy, but it means two clients can diverge if timing, collision, or network delivery differs. Later architecture work should make those tradeoffs explicit before adding competitive features.
