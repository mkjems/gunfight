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

- [ ] In lobby screen add particle burst to gun when it is activated, but fire no bullet. Bursts should be same style as in the game.
- [ ] In lobby screen desktop - avoid title and keyboard instructions jump on screen when entering into ready state (possibly because of display none).
- [ ] If there is a previous game between the two players, the top line containing 'Game over' and the player names and score, should show in the main lobby.

## P11 Mobile lobby screen improvements

- [ ] on mobile, in the lobby. Ad some vertical space between the 'Play gunfight' button and the other two buttons.

## P12 Improve visual impact of game

- [ ] Add a an option for a rain effect on the scenario. It should just look like it is raining. I would like to see raindrops falling at an 7 degrees angle and hitting the ground. We cant do collision detection for all drops so we must cheat.

## Other Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
