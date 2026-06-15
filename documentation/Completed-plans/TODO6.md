# Gunfight TODO6 P8

Completed: 2026-06-15.

## More State Model improvements

### P3.4 - Low-frequency server-authoritative state model

- [x] Define the target ownership model.
    - [x] Keep movement, aiming, bullets, hit detection, hit feel, sounds, animation, and immediate input response client-owned.
    - [x] Move slow lifecycle authority to the server: connection status, readiness, ready countdown, round phase, scenario, round number, score, match clock, hit pause, game over, abandonment, and requeue.
    - [x] Do not add server-side movement, bullet physics, rollback, or hit validation in this pass.
- [x] Design one server-owned lifecycle state.
    - [x] Replace the current split between `GameSession.status` and `gfmodel` readiness/match state with one clear server lifecycle owner.
    - [x] Add an explicit server phase: `waiting`, `readying`, `readyCountdown`, `roundIntro`, `playing`, `hitPause`, `gameOver`, `abandoned`, and `closed`.
    - [x] Add a monotonically increasing model `version` so clients can ignore stale state updates.
    - [x] Add server timestamps for phase timing: `phaseStartedAt`, optional `phaseEndsAt`, and `matchEndsAt`.
- [x] Make readiness and game start server-driven.
    - [x] Keep `clientReady` as the player intent event.
    - [x] When both players are ready, have the server enter `readyCountdown` instead of immediately switching clients into gameplay.
    - [x] Publish the countdown timing in the public model so both clients show the same ready pause.
    - [x] Advance from `readyCountdown` to the first round phase from a server timer, not a client inference.
- [x] Make round phase transitions server-driven at low frequency.
    - [x] Let the server publish when a round enters `roundIntro`, `playing`, `hitPause`, and the next round.
    - [x] Keep client `roundState` as presentation state that follows the server phase.
    - [x] Replace local-only scenario switching with server phase updates that decide exactly when the next scenario becomes active.
    - [x] Ensure the client can still animate transitions smoothly between server phase updates.
- [x] Make the match clock authoritative on the server.
    - [x] Start `matchEndsAt` when the server starts the match.
    - [x] Replace client-owned `matchExpired` authority with server-side match expiry.
    - [x] Keep the client timer display derived from server timestamps.
    - [x] Record game over and high scores from the server-owned expiry/result path.
- [x] Rework hit result handling around server phases.
    - [x] Keep the hit report client-originated for now.
    - [x] Accept `roundResult` only during the server `playing` phase for the current `roundNumber`.
    - [x] On accepted hit, have the server increment score and enter `hitPause` with a server `phaseEndsAt`.
    - [x] After `hitPause`, have the server decide whether to enter `gameOver` or advance to the next round.
- [x] Update disconnect, requeue, and abandonment rules.
    - [x] Define how each server phase behaves when a player disconnects.
    - [x] Keep automatic pairing limited to safe waiting states.
    - [x] Ensure abandoned games clear ready state, stop phase timers, and publish one final authoritative model.
- [x] Update the public model and client parsing.
    - [x] Add `version`, `phase`, `phaseStartedAt`, `phaseEndsAt`, and `matchEndsAt` to the shared contracts.
    - [x] Remove the compatibility `status` field once clients no longer need it.
    - [x] Update the client model parser and model-update planner to consume the new lifecycle fields.
- [x] Update client orchestration.
    - [x] Make `ClientModelUpdateFlow` translate server phase changes into local presentation transitions.
    - [x] Remove legacy client-side ready-to-start fallbacks so only server `roundIntro` starts a round.
    - [x] Keep local effects such as sounds, messages, death animation, particles, and intro walking on the client.
    - [x] Make local timers presentation-only where the server now owns the official phase end.
    - [x] Ignore stale or duplicate model updates by comparing server model `version`.
- [x] Add coverage.
    - [x] Add server tests for legal phase transitions.
    - [x] Add server tests for illegal or stale events in each phase.
    - [x] Add server tests for ready countdown, match expiry, hit pause expiry, disconnect, requeue, and game over.
    - [x] Add client tests for following server phases without owning lifecycle authority.
    - [x] Run and verify browser smoke coverage for ready countdown, hit pause, next-round scenario switch, and server-owned game over.
- [x] Update documentation.
    - [x] Update `Connection-state-model.md` with the new server lifecycle diagram.
    - [x] Update `State-ownership.md` to describe slow server authority and fast client authority.
    - [x] Update `Specification-main.md` for ready countdown, match clock, hit pause, and game-over behavior.



## P8 - Concentrate Control Logic On The Server

Goal: keep slow/control logic on the server while keeping presentation and
real-time gameplay responsive on the client.

## Completed Ownership Boundary

- [x] Server owns slow/control state: connection, pairing, names, ready flags,
      ready countdown, lobby-to-game transition, scenario selection,
      `roundNumber`, phase changes, score, match clock, hit pause, game over,
      high-score recording, abandonment, requeue, and return-to-lobby timing.
- [x] Client owns real-time gameplay: input feel, movement, aiming, bullets,
      collision, local hit detection, camera, particles, sounds, touch controls,
      and rendering.
- [x] Client owns presentation of server phases: lobby UI, `GET READY`, `DRAW!`,
      intro walking, hit text, death animation, game-over display, and HUD
      rendering.
- [x] Client slow-state events are intent/report events only. The server decides
      whether the intent is accepted and what authoritative public model follows.
- [x] Every accepted server-side public model change increments `version`.

## Audit Notes

Client lifecycle/control places reviewed:

- `ClientModelUpdateFlow` and `ClientModelUpdatePlan`: client follower of
  authoritative phase updates.
- `ClientRoundRitual`: presentation for `roundIntro`; timers check the latest
  server phase before changing visible state.
- `ClientPlayerHitFlow`: hit presentation plus `roundResult` report; no local
  round advance.
- `ClientRoundResetFlow`: presentation reset only; it no longer emits lifecycle
  reset requests.
- `ClientRoundEndFlow`: game-over presentation only; it no longer emits
  match-expiry requests.
- `ClientHitDetection`: local hit and obstacle detection only; match expiry is
  not a client result.
- `ClientScreens`: presentation screen and legal local round-state transitions.
- Runtime helpers: stale model guard by `version`, server timing sync, and
  server `gameOver` follower.

Decision classification:

- Server-control: `clientReady`, accepted `roundResult`, match expiry,
  hit-pause expiry, ready countdown expiry, game-over lobby return, disconnect,
  requeue, leave, join, and name changes.
- Client-presentation: lobby UI, round ritual text and walking, hit text, death
  animation, game-over display, HUD, and local screen state.
- Real-time gameplay: input, movement, aiming, bullets, collision, local hit
  detection, obstacle damage, camera, particles, sounds, and touch controls.

Server socket events that mutate lifecycle state:

- `clientReady`
- `roundResult`
- `requeue`
- `leaveGame`
- `joinLobby`
- `updateName`

Compatibility paths removed:

- Public `status`
- Legacy lifecycle socket events
- No-phase local match timer
- No-phase local round advance

## Completed Implementation

- [x] Hardened `gfmodel` as the lifecycle state machine for `waiting`,
      `readying`, `readyCountdown`, `roundIntro`, `playing`, `hitPause`,
      `gameOver`, `abandoned`, and `closed`.
- [x] Routed phase changes through guarded command methods that update
      `phaseStartedAt`, optional `phaseEndsAt`, optional `matchEndsAt`, and
      `version`.
- [x] Added a server-owned return path from `gameOver` back to lobby state.
- [x] Centralized server timers for phase expiry and stale timer protection.
- [x] Made the public model sufficient for the client to follow lifecycle
      state without deciding it.
- [x] Converted the client into a lifecycle follower through
      `ClientModelUpdateFlow`.
- [x] Preserved client-owned real-time gameplay and kept `roundResult` as a
      client-originated hit report.
- [x] Simplified socket contracts around intent/report events and authoritative
      `modelUpdate` events.
- [x] Strengthened disconnect, abandonment, requeue, auto-pairing, and reconnect
      behavior. P8 reconnect rule: a browser reconnects as a fresh socket; there
      is no active-game restoration.

## Completed Coverage

- [x] Server tests cover legal and illegal transitions for every phase.
- [x] Server tests cover stale timer protection by version and phase.
- [x] Server tests cover accepted slow-state events incrementing `version`.
- [x] Server tests cover rejected stale events leaving public state unchanged.
- [x] Server tests cover game-over expiry resetting ready/lobby state from the
      server.
- [x] Server tests cover disconnect, abandon, requeue, and auto-pairing in each
      relevant phase.
- [x] Client tests cover ready flags not starting gameplay, only server
      `roundIntro` starting the round ritual, stale presentation timers, server
      game-over return, stale model versions, and fresh same-phase model updates.
- [x] Browser smoke tests cover two clients joining, name edits, ready countdown,
      gameplay entry, accepted hit/hit-pause model flow, score stability across
      the next round and game over, server-controlled return to lobby, abandoned
      requeue, and rejected late reports.

## Completed Documentation

- [x] Updated `Connection-state-model.md` with final P8 lifecycle rules.
- [x] Updated `State-ownership.md` with the stricter server-control/client-
      presentation boundary.
- [x] Updated `Specification-main.md` for ready countdown, hit pause, game over,
      and return-to-lobby timing.
- [x] Updated `code-quality-scorecard.md` with the final browser smoke count and
      lifecycle coverage.
