# Gunfight TODO6

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

### P8 - Concentrate all control-logic, outside off gameplay itself, on the server side. Make client about presentation-logic and real time game play.

- [x] Define the target ownership boundary.
    - [x] Server owns all slow/control state: connection, pairing, names, ready
          flags, ready countdown, lobby-to-game transition, scenario selection,
          round number, phase changes, score, match clock, hit pause, game over,
          high-score recording, abandonment, requeue, and return-to-lobby timing.
    - [x] Client owns fast real-time gameplay: input feel, movement, aiming,
          bullets, collision, local hit detection, camera, particles, sounds,
          touch controls, and rendering.
    - [x] Client owns presentation of server phases: lobby UI, `GET READY`,
          `DRAW!`, intro walking, hit text, death animation, game-over display,
          and HUD rendering.
    - [x] Client events that mutate slow state are intent/report events only;
          the server decides whether the intent is accepted and what the next
          public model is.
    - [x] Every accepted server-side public model change increments `version`.
- [x] Audit all current lifecycle/control decisions.
    - [x] List every client place that starts, ends, resets, or advances a game
          phase: `ClientModelUpdateFlow`, `ClientRoundRitual`,
          `ClientPlayerHitFlow`, `ClientRoundResetFlow`, `ClientRoundEndFlow`,
          `ClientScreens`, and runtime helpers.
        - `ClientModelUpdateFlow`/`ClientModelUpdatePlan`: client follower of
          authoritative phase updates.
        - `ClientRoundRitual`: presentation for `roundIntro`; timers check the
          latest server phase before changing visible state.
        - `ClientPlayerHitFlow`: hit presentation plus `roundResult` report; no
          local round advance.
        - `ClientRoundResetFlow`: presentation reset only; it no longer emits
          lifecycle reset requests.
        - `ClientRoundEndFlow`: game-over presentation only; it no longer emits
          match-expiry requests.
        - `ClientHitDetection`: local hit/obstacle detection only; match expiry
          is not a client result.
        - `ClientScreens`: presentation screen and legal local round-state
          transitions.
        - Runtime helpers: stale model guard by `version`, server timing sync,
          and server `gameOver` follower.
    - [x] Classify each decision as server-control, client-presentation, or
          real-time gameplay.
        - Server-control: `clientReady`, accepted `roundResult`, match expiry,
          hit-pause expiry, ready countdown expiry, game-over lobby return,
          disconnect, requeue, leave, join, and name changes.
        - Client-presentation: lobby UI, round ritual text and walking, hit
          text, death animation, game-over display, HUD, local screen state.
        - Real-time gameplay: input, movement, aiming, bullets, collision,
          local hit detection, obstacle damage, camera, particles, sounds, and
          touch controls.
    - [x] List every server socket event that mutates lifecycle state:
          `clientReady`, `roundResult`, `requeue`, `leaveGame`, `joinLobby`,
          and `updateName`.
    - [x] Identify compatibility paths that still exist only for the old client
          lifecycle model.
        - Compatibility paths removed: public `status`, legacy lifecycle socket
          events, no-phase local match timer, and no-phase local round advance.
- [x] Harden `gfmodel` as the one lifecycle state machine.
    - [x] Write the legal transition table for `waiting`, `readying`,
          `readyCountdown`, `roundIntro`, `playing`, `hitPause`, `gameOver`,
          `abandoned`, and `closed`.
    - [x] Route all phase changes through a small set of command methods with
          transition guards.
    - [x] Keep `phaseStartedAt`, optional `phaseEndsAt`, optional `matchEndsAt`,
          and `version` updated by the same transition path.
    - [x] Add a clear server-owned return path from `gameOver` back to
          `readying` or `waiting`; do not require the client to decide when the
          match is reset.
    - [x] Make name changes, ready changes, disconnects, requeues, accepted hit
          reports, match expiry, and high-score recording all produce versioned
          model updates when they affect public state.
- [x] Centralize server timers.
    - [x] Keep one server scheduler responsible for `phaseEndsAt`.
    - [x] Schedule and validate timed transitions for `readyCountdown`,
          `roundIntro`, `playing`, `hitPause`, and `gameOver`.
    - [x] Ensure stale timers cannot advance a game after a newer phase or
          version has replaced them.
    - [x] Clear timers when a game becomes `abandoned` or `closed`.
- [x] Make the public model sufficient for clients to follow without deciding.
    - [x] Confirm the client can render every non-gameplay phase from
          `phase`, `version`, `phaseStartedAt`, `phaseEndsAt`, `matchEndsAt`,
          `roundNumber`, `scores`, `clients`, and `currentScenario`.
    - [x] Add any missing neutral timing/state fields needed for presentation;
          avoid adding UI text decisions to the server unless they are true game
          state.
    - [x] Remove the compatibility `status` field after all client code follows
          `phase`.
    - [x] Document which model fields are authoritative and which are
          presentation hints.
- [x] Convert the client into a lifecycle follower.
    - [x] Make `ClientModelUpdateFlow` the only client entry point that reacts
          to authoritative phase changes.
    - [x] Remove any client path that starts a round from ready flags, local
          timeout, local score state, or local match expiry.
    - [x] Remove client-owned `matchExpired` authority and socket event.
    - [x] Remove client-owned `resetReady`/return-to-lobby authority once the
          server owns `gameOver` expiry and lobby reset.
    - [x] Keep client timers only for presentation inside the current server
          phase: animation beats, text timing, effects, sounds, and local HUD
          refresh.
    - [x] Make duplicate or stale model updates no-ops by `version`.
    - [x] Make out-of-order presentation timers check the latest server phase
          before applying visible state.
- [x] Preserve responsive real-time gameplay on the client.
    - [x] Keep movement, aiming, shooting, bullets, collision, obstacle damage,
          hit detection, ammo presentation, particles, camera, and sound local.
    - [x] Keep `roundResult` as a client-originated hit report for now.
    - [x] Keep server validation limited to current phase, current round,
          connected clients, reporting socket ownership, and duplicate
          prevention.
    - [x] Do not add server-side bullet simulation, rollback, or authoritative
          movement in P8.
- [x] Simplify socket event contracts.
    - [x] Separate client intent/report events from authoritative server
          `modelUpdate` events in documentation and tests.
    - [x] Ensure each accepted intent emits exactly one fresh public model or a
          clearly documented no-op.
    - [x] Ensure rejected or stale intents do not mutate the public model.
    - [x] Remove legacy socket events once no client code depends on them.
- [x] Strengthen disconnect, requeue, and reconnect behavior.
    - [x] Define server behavior for disconnect in every phase.
    - [x] Ensure automatic pairing only uses safe one-player `waiting` games.
    - [x] Ensure abandoned games publish one final model and do not accept late
          gameplay reports.
    - [x] Decide whether reconnect should restore a player to an active game or
          always create a new lobby session; document the rule before coding it.
- [ ] Add focused server coverage.
    - [ ] Test legal and illegal transitions for every phase.
    - [x] Test stale timer protection by version and phase.
    - [x] Test every accepted slow-state event increments `version`.
    - [x] Test rejected stale events leave `version` and public state unchanged.
    - [x] Test game-over expiry resets ready/lobby state from the server.
    - [x] Test disconnect, abandon, requeue, and auto-pairing in each relevant
          phase.
- [ ] Add focused client coverage.
    - [x] Test that ready flags alone never start gameplay.
    - [x] Test that only server `roundIntro` starts the round ritual.
    - [x] Test that local presentation timers cannot advance lifecycle after
          the server phase changed.
    - [x] Test that game over and return-to-lobby follow server model updates.
    - [x] Test that stale model versions are ignored and fresh same-phase
          versions update names, scores, and public metadata.
- [ ] Add browser smoke coverage.
    - [ ] Two clients can join, edit names, ready up, see ready countdown, and
          enter gameplay.
    - [ ] A hit shows hit presentation until the server `hitPause` phase ends.
    - [ ] Scores stay stable across round starts and game over.
    - [ ] Game over returns to the lobby from server-controlled timing.
    - [ ] An abandoned game requeues safely without accepting late reports.
- [ ] Update documentation after implementation.
    - [x] Update `Connection-state-model.md` with the final P8 lifecycle rules.
    - [x] Update `State-ownership.md` with the stricter server-control/client-
          presentation boundary.
    - [ ] Update `Specification-main.md` for ready countdown, hit pause,
          game-over, and return-to-lobby timing.
    - [ ] Move completed P8 planning notes to the completed-plans graveyard only
          when the implementation is done and verified.

## Ideas

- [ ] In lobby screen add particle burst to gun, but fire no bullet.
- [ ] In lobby screen desktop - avoid H1 title and keyboard instructions jump on screen when entering into ready state.
- [ ] When both players have marked themselves as ready - I would like a leave-lobby-for-game-sequence. I would like the lobby screen to keep the players in the lobby for a few seconds so you can see the READY status in negative text for 2 seconds and hear the ready sound before switching to the game screen.
- I would like to reproduce a feature of the original arcade game:
  [ ] If there is a last played game, the top line containing 'Game over' and the player names and score, should show in the main lobby after the game.
  [ ] Add a an option for a rain effect on the scenario. It should just look like it was raining. it usually is i dramatic movie scenes. we cant do collision detection for all drops so we must cheat.

## Other Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
- [ ] Add the number of wins/kills after the name in the lobby: LUKE 5/10
