# Gunfight TODO7

## P9 - Centralize Shared Protocol Constants

- [x] Extract `MATCH_STATE` as an enum-like string constant map.
    - [x] Keep the existing wire values: `idle`, `playing`, and `gameOver`.
    - [x] Derive the `MatchState` type from `MATCH_STATE`.
    - [x] Replace server/client comparisons that currently use inline match-state strings.
    - [x] Add a small shared contract test for the constant map and any guard.
- [x] Extract `SOCKET_EVENT` as an enum-like string constant map.
    - [x] Include client intent/report events: `clientReady`, `roundResult`,
          `requeue`, `leaveGame`, `joinLobby`, `updateName`, `clientKeyEvent`,
          `playerPosition`, and `obstacleDamage`.
    - [x] Include authoritative/server events: `joinedGame`, `newClient`,
          `modelUpdate`, `keyEvent`, `highScores`, `leftGame`, `playerPosition`,
          `obstacleDamage`, and `gameResult`.
    - [x] Replace server, client network, flow, input, and browser smoke literals
          where the event name is part of the socket protocol.
    - [x] Keep tests readable; use constants for protocol behavior, but keep
          expected payload text literal where that is clearer.
    - [x] Add coverage that the exported event values match the public wire names.
- [x] Extract `LOBBY_STATUS` as a server-local enum-like string constant map.
    - [x] Keep it local to `server/gameModules/lobby.ts` unless another module
          needs it.
    - [x] Use it for the derived lobby status values: `waiting`, `readying`,
          `playing`, `abandoned`, and `closed`.
    - [x] Keep `LOBBY_STATUS` separate from `GAME_PHASE`; lobby status is a
          coarse server helper, while `GAME_PHASE` is the public lifecycle
          protocol.
- [x] Review timer-name strings after the protocol constants are done.
    - [x] Consider extracting only repeated coordination names such as `ritual`,
          `hit`, `reset`, and `abandonedRequeue`.
    - [x] Do not create a broad global constants file; keep constants near their
          owning module unless they are shared protocol values.

## P10 - Lobby screen improvements

- [ ] In lobby screen, add particle burst to gun when it is activated, but fire no bullet. Bursts should be same style as in the game.
- [ ] In lobby screen desktop - avoid title and keyboard instructions jump on screen when entering into ready state (possibly because of display none).
- [ ] In desktop main lobby, if the current two players have just completed a game together, show a top HUD result line.
    - [ ] Reuse the game HUD layout: left side score then current player name, center `GAME OVER`, right side current player name then score.
    - [ ] Keep it tied only to the current two-player game session; do not store or show longer-term history.
    - [ ] Hide it when either player leaves, disconnects, is paired with a new opponent, or either player enters `READY`.
    - [ ] Do not show this result line on mobile.
    - [ ] Use current lobby names when rendering the previous result.

## P10.5 - Investigate how Eslint can help improve code quality

- [x] Document what is possible with ESLint.
- [x] Document how agents should work well with ESLint.
- [x] Document how to find rules that preserve human-readable code.
- [x] Tighten the current JavaScript lint baseline and make lint targets
      explicit.

## P10.6 - Add TypeScript ESLint

- [x] Add TypeScript ESLint dependencies and parser/plugin configuration.
- [x] Update lint scripts so JavaScript and TypeScript files are linted.
- [x] Document the responsibility split between ESLint, Prettier, and `tsc`.
- [x] Fix or document any low-noise rule findings from the first TypeScript
      lint run.

## P10.7 - Experiment with ESLint rules

- [x] Add architecture-boundary rules incrementally.
    - [x] `shared/**` must not import client or server modules.
    - [x] client modules must not import server modules.
    - [x] View models must not import side-effectful client layers or use DOM,
          socket, timer, canvas, runtime, or platform side effects.
    - [x] State modules must not import side-effectful client layers or UI code;
          DOM, socket, canvas, runtime, and platform side effects are
          restricted. Timer globals are allowed only in `clientTimers.ts`.
- [ ] Add candidate TypeScript escape-hatch rules.
    - [ ] Reject `any`, TypeScript suppression comments, and non-null
          assertions unless a specific exception is documented.
    - [ ] Prefer explicit type-only imports where they improve readability.
- [ ] Trial type-aware TypeScript ESLint rules separately from normal lint.
    - [x] Do not enable promise and async safety rules now; the first useful
          findings were in lower-priority tool/install code, and the type-aware
          lint cost is not worth it yet.
    - [ ] Consider switch exhaustiveness only where it fits the project's
          const-map state style.
    - [ ] Keep type-aware rules only if the added lint time and findings are
          worthwhile.
- [ ] Trial human-readability smell rules as warnings first.
    - [x] Add `npm run lint:complexity` as a warning-only review pass.
    - [x] Add `npm run lint:shape` as a warning-only file/function size review
          pass.
    - [x] Exclude `client/src/tools/**` from complexity warnings; tools should
          work correctly but do not need polished application architecture.
    - [x] Exclude `client/src/tools/**`, `server/test/**`, and `browser-smoke/**`
          from shape warnings.
    - [ ] Review complexity, shape, nesting depth, and parameter-count warnings
          by reading the affected code, not by blindly satisfying numbers.
    - [ ] Consider restricted syntax for focused tests and TypeScript enums if
          those patterns become real risks.
- [ ] Decide which rules to keep.
    - [ ] Keep rules that catch real unwanted patterns with low noise.
    - [ ] Drop rules that mostly create churn, style fights, or less readable
          code.
    - [ ] Document kept rules and rejected rules in the code quality scorecard.

## P11 Mobile lobby screen improvements

- [ ]On mobile, in the lobby. Ad some vertical space between the 'Play gunfight' button and the other two buttons.

## P12 Improve visual impact of game

- [ ] Add a an option for a rain effect on the scenario. It should just look like it is raining. I would like to see raindrops falling at an 7 degrees angle and hitting the ground. We cant do collision detection for all drops so we must cheat.

## Other Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
