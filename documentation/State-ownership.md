# State Ownership

This is the current state split. Keep it updated when ownership changes.

## Server-owned state

- Socket.IO connections and room membership.
- Game ids and room ids.
- Player ids, names, slots, and ready flags.
- Game lifecycle phase, projected status, phase timestamps, return-to-lobby
  timing, and model version.
- Current scenario selection, `roundNumber`, match state, match clock, and match
  score.
- Accepted round results and final game-result records for high scores.
- High score table in server memory.

## Client-owned state

- Active screen and round phase.
- Canvas rendering and DOM HUD rendering.
- Local player input state.
- Local simulation of players, bullets, collision, hit detection, obstacle
  damage, ammo, and match timer presentation.
- Local display copy of the server-owned match score.
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
- Round results are reported by the client that detected the winning hit. The
  server accepts only current, non-duplicate, winner-owned results and updates
  score.
- Match expiry is owned by the server clock. Clients display the server
  `matchEndsAt` value.

## Current risk

Gameplay is mostly client-authoritative. This is acceptable for a small public
arcade toy, but it means two clients can diverge if timing, collision, hit
detection, or network delivery differs. The server owns the slow lifecycle,
score, scenario changes, and match clock now, but it does not yet validate
bullet physics.
