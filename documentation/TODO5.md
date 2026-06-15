# Gunfight TODO5

## State Model improvements

### P3.3 - State model review and future plans

- [ ] State model review
    - [ ] We should look into the current state model a come up with an improvement.
    - [ ] We should look into if disconnect and re-connect are handled correct from mobile and desktop.
    - [ ] How do we pair up players who have lost they opponent? Do we use alone players? or wait for their old opponents to reconnect.

- [x] No ready state without opponent
    - [x] Should you be able to be in ready state when you have no opponent? No. `READY` requires a connected opponent.
    - [x] If a player loses their opponent because of disconnect or reload, the remaining player loses `READY` state and returns to waiting for an opponent.

- [x] Auto pair alone players
    - [x] When two players are alone in separate waiting games, automatically pair them into one game.
    - [x] When pairing previously alone players, clear ready state for both players.
    - [x] Do not pair players out of `playing` games; only pair `waiting` single-player games.
    - [x] Update docs

## P7 Code quality maintainability readability

My opinion on code quality: The best way to ensure quality is to write readable modular and understandable code that is easy to change.
The idea is not to create a giant harness of things we have to do all the time. The idea is to make the code itself logical and nice to work with. Self descriptive.

- [ ] Create `documentation/code-quality-scorecard.md`
    - [ ] Record current check status: format, lint, typecheck, Node tests, browser smoke tests.
    - [ ] Document current architecture boundaries from `Architecture-flow.md`, `State-ownership.md`, and `UI-ownership.md`.
    - [ ] List the largest or most central modules that may need future splitting.
    - [ ] List known weak spots where code and documentation may drift.
    - [ ] List where typing is intentionally weaker, especially server JS/test JS.
    - [ ] List constants/config values that should stay local vs shared.

- [ ] Audit module boundaries
    - [ ] Check that UI components do not own game state or side effects.
    - [ ] Check that view models stay framework-independent.
    - [ ] Check that flow modules remain the side-effect boundary.

- [ ] Audit game constants
    - [ ] Identify repeated durations, dimensions, control labels, socket event names, and state strings.
    - [ ] Extract only constants that are reused or define product rules.
    - [ ] Avoid one giant constants file; keep constants near their owning module unless shared.

- [ ] Audit tests by behavior area
    - [ ] Map tests to lobby, matchmaking, round flow, touch controls, high scores, editors, and browser smoke.
    - [ ] Identify behavior with high risk but thin coverage.

- [ ] Audit duplication carefully
    - [ ] Remove duplicated rules, protocols, and state derivation.
    - [ ] Do not force DRY on drawing code or simple symmetric UI where duplication is clearer.

## Other Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
- [ ] Add the number of wins/kills after the name in the lobby: LUKE 5/10

## MAYBE bad Ideas

- [ ] After the game. Players should see the high score page for a period of time, before returning to main lobby.
- [ ] When both players have marked themselves as ready - I would like a leave-lobby-for-game-sequence. I would like the lobby screen to keep the players in the lobby for a few seconds so you can see the READY status in negative text for 2 seconds and hear the ready sound before switching to the game screen.
- [ ] We should collect all game constants like this leave-lobby-pause-duration above in some central shared place.
- [ ] On Desktop, after a game. 'Game over' should continue to be shown in the main lobby as should the last game result in the top line.
