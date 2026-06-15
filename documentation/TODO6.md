# Gunfight TODO6

## More State Model improvements

### P3.4 - Low-frequency server-authoritative state model

- [ ] Define the target ownership model.
    - [ ] Keep movement, aiming, bullets, hit detection, hit feel, sounds, animation, and immediate input response client-owned.
    - [ ] Move slow lifecycle authority to the server: connection status, readiness, ready countdown, round phase, scenario, round number, score, match clock, hit pause, game over, abandonment, and requeue.
    - [ ] Do not add server-side movement, bullet physics, rollback, or hit validation in this pass.
- [ ] Design one server-owned lifecycle state.
    - [ ] Replace the current split between `GameSession.status` and `gfmodel` readiness/match state with one clear server lifecycle owner.
    - [ ] Add an explicit server phase, for example `waiting`, `readying`, `readyCountdown`, `roundIntro`, `playing`, `hitPause`, `roundTransition`, `gameOver`, `abandoned`, and `closed`.
    - [ ] Add a monotonically increasing model `version` so clients can ignore stale state updates.
    - [ ] Add server timestamps for phase timing: `phaseStartedAt`, optional `phaseEndsAt`, and `matchEndsAt`.
- [ ] Make readiness and game start server-driven.
    - [ ] Keep `clientReady` as the player intent event.
    - [ ] When both players are ready, have the server enter `readyCountdown` instead of immediately switching clients into gameplay.
    - [ ] Publish the countdown timing in the public model so both clients show the same ready pause.
    - [ ] Advance from `readyCountdown` to the first round phase from a server timer, not a client inference.
- [ ] Make round phase transitions server-driven at low frequency.
    - [ ] Let the server publish when a round enters `roundIntro`, `playing`, `hitPause`, `roundTransition`, and the next round.
    - [ ] Keep client `roundState` as presentation state that follows the server phase.
    - [ ] Replace local-only scenario switching with server phase updates that decide exactly when the next scenario becomes active.
    - [ ] Ensure the client can still animate transitions smoothly between server phase updates.
- [ ] Make the match clock authoritative on the server.
    - [ ] Start `matchEndsAt` when the server starts the match.
    - [ ] Replace client-owned `matchExpired` authority with server-side match expiry.
    - [ ] Keep the client timer display derived from server timestamps.
    - [ ] Record game over and high scores from the server-owned expiry/result path.
- [ ] Rework hit result handling around server phases.
    - [ ] Keep the hit report client-originated for now.
    - [ ] Accept `roundResult` only during the server `playing` phase for the current `roundNumber`.
    - [ ] On accepted hit, have the server increment score and enter `hitPause` with a server `phaseEndsAt`.
    - [ ] After `hitPause`, have the server decide whether to enter `gameOver` or advance to the next round.
- [ ] Update disconnect, requeue, and abandonment rules.
    - [ ] Define how each server phase behaves when a player disconnects.
    - [ ] Keep automatic pairing limited to safe waiting states.
    - [ ] Ensure abandoned games clear ready state, stop phase timers, and publish one final authoritative model.
- [ ] Update the public model and client parsing.
    - [ ] Add `version`, `phase`, `phaseStartedAt`, `phaseEndsAt`, and `matchEndsAt` to the shared contracts.
    - [ ] Remove or deprecate redundant lifecycle fields once clients no longer need them.
    - [ ] Update the client model parser and model-update planner to consume the new lifecycle fields.
- [ ] Update client orchestration.
    - [ ] Make `ClientModelUpdateFlow` translate server phase changes into local presentation transitions.
    - [ ] Keep local effects such as sounds, messages, death animation, particles, and intro walking on the client.
    - [ ] Make local timers presentation-only where the server now owns the official phase end.
    - [ ] Ignore stale or duplicate model updates by comparing server model `version`.
- [ ] Add coverage.
    - [ ] Add server tests for every legal phase transition.
    - [ ] Add server tests for illegal or stale events in each phase.
    - [ ] Add server tests for ready countdown, match expiry, hit pause expiry, disconnect, requeue, and game over.
    - [ ] Add client tests for following server phases without owning lifecycle authority.
    - [ ] Add browser smoke coverage for ready countdown, hit pause, next-round scenario switch, and server-owned game over.
- [ ] Update documentation.
    - [ ] Update `Connection-state-model.md` with the new server lifecycle diagram.
    - [ ] Update `State-ownership.md` to describe slow server authority and fast client authority.
    - [ ] Update `Specification-main.md` for ready countdown, match clock, hit pause, and game-over behavior.

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
