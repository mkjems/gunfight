# Gunfight TODO7

## P9 - Centralize Shared Protocol Constants

- [ ] Extract `MATCH_STATE` as an enum-like string constant map.
    - [ ] Keep the existing wire values: `idle`, `playing`, and `gameOver`.
    - [ ] Derive the `MatchState` type from `MATCH_STATE`.
    - [ ] Replace server/client comparisons that currently use inline match-state strings.
    - [ ] Add a small shared contract test for the constant map and any guard.
- [ ] Extract `SOCKET_EVENT` as an enum-like string constant map.
    - [ ] Include client intent/report events: `clientReady`, `roundResult`,
          `requeue`, `leaveGame`, `joinLobby`, `updateName`, `clientKeyEvent`,
          `playerPosition`, and `obstacleDamage`.
    - [ ] Include authoritative/server events: `joinedGame`, `newClient`,
          `modelUpdate`, `playerKeyEvent`, `playerPosition`, `obstacleDamage`,
          and `gameResult`.
    - [ ] Replace server, client network, flow, input, and browser smoke literals
          where the event name is part of the socket protocol.
    - [ ] Keep tests readable; use constants for protocol behavior, but keep
          expected payload text literal where that is clearer.
    - [ ] Add coverage that the exported event values match the public wire names.
- [ ] Extract `LOBBY_STATUS` as a server-local enum-like string constant map.
    - [ ] Keep it local to `server/gameModules/lobby.ts` unless another module
          needs it.
    - [ ] Use it for the derived lobby status values: `waiting`, `readying`,
          `playing`, `abandoned`, and `closed`.
    - [ ] Keep `LOBBY_STATUS` separate from `GAME_PHASE`; lobby status is a
          coarse server helper, while `GAME_PHASE` is the public lifecycle
          protocol.
- [ ] Review timer-name strings after the protocol constants are done.
    - [ ] Consider extracting only repeated coordination names such as `ritual`,
          `hit`, `reset`, and `abandonedRequeue`.
    - [ ] Do not create a broad global constants file; keep constants near their
          owning module unless they are shared protocol values.

## Ideas

- [ ] In lobby screen add particle burst to gun, but fire no bullet.
- [ ] In lobby screen desktop - avoid title and keyboard instructions jump on screen when entering into ready state.
      [ ] If there is a previous game between the two players, the top line containing 'Game over' and the player names and score, should show in the main lobby.
      [ ] Add a an option for a rain effect on the scenario. It should just look like it is raining. I would like to see raindrops falling at an angle and hitting the ground. We cant do collision detection for all drops so we must cheat.

## Other Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
