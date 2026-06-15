# Gunfight TODO5

## State Model improvements

### P3.3 - State model review and future plans

- [x] State model review
    - [x] Confirm the target ownership model.
        - [x] Keep movement, input response, bullets, hit feel, sounds, animation, and local round timing client-owned.
        - [x] Move authoritative match score, accepted round result, game-over decision, and high-score result source to the server.
        - [x] Do not move full gameplay simulation or server-side physics in this pass.
    - [x] Add server-owned match state.
        - [x] Store per-player match score on the server session or game model.
        - [x] Store enough round state to reject stale or duplicate round results.
        - [x] Include authoritative score and match state in the public game model.
    - [x] Replace client-owned score progression.
        - [x] Replace or wrap `advanceRound` with a round-result event sent by the client that saw the hit.
        - [x] Validate that the reporting socket belongs to the game, the game is `playing`, the round is current, both players are connected, and the round result has not already been accepted.
        - [x] Let the server increment score, decide whether the match is over, advance the scenario and `roundNumber` when needed, and broadcast the updated model.
    - [x] Make the client consume server-owned score.
        - [x] Treat score, round number, match over, and final result as authoritative values from the server model.
        - [x] Keep hit pause, round ritual, animation, audio, and responsive local controls on the client.
        - [x] Remove client-side score authority from `scoreKeeper` and round-end flow, or reduce it to display-only local state.
    - [x] Make high scores use server-owned results.
        - [x] Stop trusting a client-submitted final score as the high-score source of truth.
        - [x] Record high scores from the server-owned final match score after the server decides the game is over.
    - [x] Review state machines after the score change.
        - [x] Decide whether server `status` needs a clearer match lifecycle state beyond `playing`.
        - [x] Keep client `roundState` for presentation phases, but document how it follows server match state.
    - [x] Update coverage and documentation.
        - [x] Add server tests for score updates, stale round results, duplicate round results, game over, disconnect during play, and high-score recording.
        - [x] Add client tests for consuming server-owned score and match-over state.
        - [x] Update `Connection-state-model.md`, `State-ownership.md`, and `Specification-main.md`.
    - [ ] Future follow-up: decide whether the server should run the authoritative match clock instead of accepting client-reported `matchExpired`.

- [x] No ready state without opponent
    - [x] Should you be able to be in ready state when you have no opponent? No. `READY` requires a connected opponent.
    - [x] If a player loses their opponent because of disconnect or reload, the remaining player loses `READY` state and returns to waiting for an opponent.

- [x] Auto pair alone players
    - [x] When two players are alone in separate waiting games, automatically pair them into one game.
    - [x] When pairing previously alone players, clear ready state for both players.
    - [x] Do not pair players out of `playing` games; only pair `waiting` single-player games.
    - [x] Update docs

## P7 Code quality, maintainability, and readability

My opinion on code quality: The best way to ensure quality is to write readable modular and understandable code that is easy to change.
The idea is not to create a giant harness of things we have to do all the time. The idea is to make the code itself logical and nice to work with. Self-descriptive.

- [x] Create `documentation/code-quality-scorecard.md`
    - [x] Record current check status: format, lint, typecheck, Node tests, browser smoke tests.
    - [x] Document current architecture boundaries from `Architecture-flow.md`, `State-ownership.md`, and `UI-ownership.md`.
    - [x] List the largest or most central modules that may need future splitting.
    - [x] List known weak spots where code and documentation may drift.
    - [x] List where typing is intentionally weaker, especially server JS/test JS.
    - [x] List constants/config values that should stay local vs shared.

- [x] Audit module boundaries
    - [x] Check that UI components do not own game state or side effects.
    - [x] Check that view models stay framework-independent.
    - [x] Check that flow modules remain the side-effect boundary.

- [x] Audit game constants
    - [x] Identify repeated durations, dimensions, control labels, socket event names, and state strings.
    - [x] Record which constants should stay local and which should move only when shared.
    - [x] Avoid one giant constants file; keep constants near their owning module unless shared.

- [x] Audit tests by behavior area
    - [x] Map tests to lobby, matchmaking, round flow, touch controls, high scores, editors, and browser smoke.
    - [x] Identify behavior with high risk but thin coverage.

- [x] Audit duplication carefully
    - [x] Identify duplicated rules, protocols, and state derivation to avoid.
    - [x] Do not force DRY on drawing code or simple symmetric UI where duplication is clearer.

- [x] Fix current formatting drift found during P7
    - [x] Format `server/scenarios.json`.
    - [x] Format `documentation/TODO5.md`.

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
