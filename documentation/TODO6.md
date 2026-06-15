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
- [ ] Update the public model and client parsing.
    - [x] Add `version`, `phase`, `phaseStartedAt`, `phaseEndsAt`, and `matchEndsAt` to the shared contracts.
    - [ ] Future follow-up: remove the compatibility `status` field once clients no longer need it.
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

## Ideas

- [ ] In lobby screen add particle burst to gun, but fire no bullet.
- [ ] In lobby screen desktop - avoid H1 title and keyboard instructions jump on screen when entering into ready state.
- [ ] When both players have marked themselves as ready - I would like a leave-lobby-for-game-sequence. I would like the lobby screen to keep the players in the lobby for a few seconds so you can see the READY status in negative text for 2 seconds and hear the ready sound before switching to the game screen.

## Other Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
- [ ] Add the number of wins/kills after the name in the lobby: LUKE 5/10

## Maybe bad Ideas

- [ ] After the game. Players should see the high score page for a period of time, before returning to main lobby.
- [ ] On Desktop, after a game. 'Game over' should continue to be shown in the main lobby as should the last game result in the top line.
