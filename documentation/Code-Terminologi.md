# Code Terminologi

This document defines the most important code and game terms. Use these names
when discussing implementation work. Keep entries short and update this file
when code names or ownership changes.

## Core actors

| Term          | Meaning                                                                                                                                                     | Main code                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| User          | The human using one browser tab. The code rarely models this directly.                                                                                      | Product language only                                               |
| Client        | A connected browser participant in a game session. On the server this is a `LobbyClient`; in the public model it is a `PublicClient`.                       | `server/gameModules/lobby.ts`, `shared/contracts.ts`                |
| Socket        | The Socket.IO connection for one browser tab. Socket ids change on reconnect.                                                                               | `server/server.js`, `client/src/network/clientNetwork.ts`           |
| Player id     | Stable id assigned by the server model while the client is in one game session. Used to identify gameplay input, positions, bullets, and scores.            | `server/gameModules/gfmodel.ts`, `shared/contracts.ts`              |
| Player        | In product language, one duelist. In engine code, often the canvas-controlled avatar object. Be precise when server clients and canvas objects both matter. | `client/src/engine/players.ts`, `client/src/engine/controllable.ts` |
| Controllable  | The imperative canvas object for a player avatar. It owns movement, aim, facing, animation frame, collision shape, and current shooting straightness.       | `client/src/engine/controllable.ts`                                 |
| Opponent      | The other connected client/player in the same game. Usually derived by comparing ids with the local `playerId`.                                             | View models and flow modules                                        |
| Local client  | The `PublicClient` whose id equals the browser runtime `playerId`.                                                                                          | `client/src/runtime/game/runtime.ts`                                |
| Remote client | A connected opponent client in the local model copy.                                                                                                        | `client/src/network/clientModelSync.ts`                             |

## Sessions and lifecycle

| Term         | Meaning                                                                                                                                              | Main code                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Game session | Server-side room/session that contains up to two clients and one game model. It has `gameId`, room name, clients, and timestamps.                    | `GameSession` in `server/gameModules/lobby.ts`        |
| Game id      | Public id for one game session, such as `G0001`.                                                                                                     | `server/gameModules/lobby.ts`                         |
| Room         | Socket.IO room for one game session, such as `game:G0001`.                                                                                           | `server/server.js`, `server/gameModules/lobby.ts`     |
| Match        | The timed competition after both players ready up. One match lasts until the server match clock expires and can contain many kills/duels.            | `matchState`, `matchEndsAt`, `scores` in `gfmodel.ts` |
| Round        | The current duel within a match. Code uses `roundNumber` for the duel count and next scenario selection.                                             | `roundNumber` in `gfmodel.ts` and `PublicGameModel`   |
| Phase        | Server-owned lifecycle value: `waiting`, `readying`, `readyCountdown`, `roundIntro`, `playing`, `hitPause`, `gameOver`, `abandoned`, or `closed`.    | `GAME_PHASE` in `shared/contracts.ts`                 |
| Round state  | Client presentation state: `waiting`, `ritual`, `playing`, `hitPause`, `roundOver`, or `gameOver`. It follows server phase but is not authoritative. | `client/src/state/clientScreens.ts`                   |
| Ready        | A server-owned client flag meaning the player has chosen to play. A lone client cannot be ready.                                                     | `readyClient` in `gfmodel.ts`                         |
| Abandoned    | Server phase used when an opponent leaves during active match phases. The remaining client returns to lobby/requeue flow.                            | `gfmodel.ts`, `client/src/flows/clientLobbyFlow.ts`   |
| Closed       | Server phase for a game after the last client leaves. Closed games are removed from the lobby map.                                                   | `gfmodel.ts`, `lobby.ts`                              |

## State and models

| Term          | Meaning                                                                                                                                                | Main code                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Public model  | Server-published state needed by clients: clients, names, slots, phase, timing, scenario, round number, match state, scores, and version.              | `PublicGameModel` in `shared/contracts.ts`                     |
| Latest model  | Browser runtime copy of the newest accepted public model. Stale models are ignored by version.                                                         | `latestModel` in `client/src/runtime/game/runtime.ts`          |
| Model version | Monotonic server number used to reject stale model updates.                                                                                            | `version` in `gfmodel.ts`                                      |
| Game model    | Server module that owns phase, timing, ready flags, scenario, round number, match state, scores, and version inside one session.                       | `server/gameModules/gfmodel.ts`                                |
| Lobby         | Server module that owns session lists, pairing, names, slots, room membership, and public-model composition. Also product name for the waiting screen. | `server/gameModules/lobby.ts`, lobby UI files                  |
| View model    | Pure client function that derives render props from state. It should not perform DOM, socket, timer, canvas, or storage side effects.                  | `client/src/ui/viewModels/`                                    |
| Flow          | Client orchestration module for side effects and sequencing between runtime state, engine, UI, input, network, sounds, and timers.                     | `client/src/flows/`                                            |
| Runtime       | The main browser orchestrator that wires dependencies, owns local state, receives socket callbacks, and runs game-loop rendering.                      | `client/src/runtime/game/runtime.ts`                           |
| Snapshot      | Serializable state frozen at a moment in time so another client can recreate the same object or result. Use the narrower term when possible.           | `BulletSnapshot`, `GameModelSnapshot` in `shared/contracts.ts` |

## Player names and identity

| Term               | Meaning                                                                                                                         | Main code                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Player name        | Public display name shown in lobby, HUD, game-over, and high scores. The server sanitizes and deduplicates names inside a game. | `lobby.ts`, `ClientIdentity`                             |
| Stored player name | Browser-owned name in `localStorage`. Initial connects and reconnects propose this name to the server.                          | `client/src/platform/clientIdentity.ts`                  |
| Name editor        | Client input model and UI screen for changing the stored/public player name.                                                    | `client/src/input/nameEditor.ts`, name-editor components |
| Identity           | Client platform adapter for reading/writing the browser-stored player name and syncing inactive editor text.                    | `client/src/platform/clientIdentity.ts`                  |

## Gameplay objects

| Term            | Meaning                                                                                                                                | Main code                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Scenario        | One battlefield layout: player starts, rocks, cacti, money bags, wagon, and decorations.                                               | `Scenario` in `shared/contracts.ts`, `server/scenarios.json` |
| Player start    | Scenario or default spawn position for a player: `x`, `y`, `facing`, and sprite frame.                                                 | `PlayerStart` in `shared/contracts.ts`                       |
| Obstacle        | Runtime collision/damage body derived from scenario content. Rocks are collision obstacles; selected objects may be damageable.        | `client/src/engine/obstacles.ts`                             |
| Rock            | Scenario object with named polygon line geometry loaded from `server/rocks.json`.                                                      | `RockDefinition`, `RockInstance`                             |
| Cactus          | Scenario decoration/obstacle type.                                                                                                     | `cacti` in `Scenario`                                        |
| Money bag       | Passive timed scenario object for now. It appears after `gameRoundSeconds` and may become part of future progression rules.            | `MoneyBagInstance`, `scenarioRenderer.ts`                    |
| Bullet          | Runtime projectile object. It owns frozen shot direction, straightness, altitude, speed, harm/resting state, collision, and rendering. | `client/src/engine/bullet.ts`                                |
| Bullet snapshot | Serializable fired-bullet state sent inside a key event so both clients simulate the same shot.                                        | `BulletSnapshot` in `shared/contracts.ts`                    |
| Shot            | In current key-event code, the optional bullet snapshot attached to a fire key event. This name is useful but a little broad.          | `ClientKeyEventPayload.shot`                                 |
| Ammo            | Per-client bullet count for the current duel. Shooting spends ammo; both players reload after kills or when both are empty.            | `client/src/engine/clientAmmo.ts`                            |
| Hit             | Client-detected bullet/player contact. The winning client reports `roundResult`; the server accepts only current, valid results.       | `client/src/flows/clientPlayerHitFlow.ts`, `gfmodel.ts`      |
| Obstacle damage | Client-detected bullet/obstacle contact relayed through the server to the opponent.                                                    | `client/src/network/clientObstacleSync.ts`                   |

## Shooting and bullet trajectory

| Term                      | Meaning                                                                                                                                       | Main code                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Aim                       | Player gun angle level, controlled by `A/Z` or touch aim. Aim chooses muzzle position and ground-plane bullet direction.                      | `Config.player.aimLevels`, `Controllable`                       |
| Facing                    | Horizontal direction, usually `1` for right and `-1` for left.                                                                                | Player starts, `Controllable`, `Bullet`                         |
| Straightness              | Bullet value from `0.0` to `1.0`. `1.0` is original straight flight. Lower values make bullets bounce, slow down, and become harmless sooner. | `Bullet.straightness`                                           |
| Shooting straightness     | Player-held value used for newly fired local bullets. It is currently derived from round number and frozen into each bullet when fired.       | `Controllable.shootingStraightness`, `Players.ensure`           |
| Round bullet straightness | Current helper that derives shooting straightness from `roundNumber` and bullet config.                                                       | `getRoundBulletStraightness` in `client/src/platform/config.ts` |
| Altitude                  | Fake vertical offset for cartoon bullet arcs. The bullet ground path remains `x,y`; drawing uses `y - altitude`.                              | `Bullet.altitude`                                               |
| Height                    | Bullet sprite/collision-box height. Do not use `height` to mean vertical arc.                                                                 | `Bullet.height`                                                 |
| Harmful                   | Whether a bullet can currently hurt a player. It depends on straightness, resting state, deletion state, and ground speed.                    | `Bullet.isHarmful`                                              |
| Resting                   | A low-straightness bullet has stopped and stays as scenery for the current round. Resting bullets do not block another shot.                  | `Bullet.isResting`                                              |
| Ricochet                  | Ground-plane reflection against rocks or screen edges. It does not change altitude directly.                                                  | `Bullet.reflect`                                                |

## Rendering and input

| Term           | Meaning                                                                                                                       | Main code                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Canvas engine  | Imperative rendering/simulation side: scene, players, bullets, obstacles, camera, collision, particles, and scenario drawing. | `client/src/engine/`                   |
| Scene          | Imperative list of drawable/movable figures updated by the game loop.                                                         | `client/src/engine/scene.ts`           |
| HUD            | DOM overlay for score, names, ammo, round messages, lobby text, high scores, name editor, and touch controls.                 | `client/src/ui/`, `ClientHudFlow`      |
| Client app     | Preact app tree that renders HUD screens from plain props and sends actions back through callbacks.                           | `client/src/ui/clientApp.tsx`          |
| Active screen  | UI screen selected from client state and public model: lobby, edit name, game, or high scores.                                | `ClientScreens`, `ClientLobbyHudFlow`  |
| Game loop      | Per-frame update/render loop. It updates simulation first, then renders canvas and HUD.                                       | `client/src/runtime/clientGameLoop.ts` |
| Camera         | Mobile-friendly viewport transform that follows the local player during gameplay.                                             | `client/src/engine/camera.ts`          |
| Touch controls | Mobile joystick, aim control, and fire button. DOM is rendered by Preact; pointer behavior is imperative.                     | `client/src/input/touchControls.ts`    |

## Networking events

| Term             | Meaning                                                                                         | Direction        |
| ---------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `joinedGame`     | Server tells a socket its game id, player id, slot, resolved name, and initial public model.    | Server to client |
| `newClient`      | Server tells existing room clients that another client joined.                                  | Server to client |
| `modelUpdate`    | Server broadcasts accepted lifecycle/session/model changes.                                     | Server to client |
| `clientReady`    | Client asks to become ready. Server may accept or ignore.                                       | Client to server |
| `updateName`     | Client asks to change public name. Server sanitizes/deduplicates and broadcasts accepted model. | Client to server |
| `clientKeyEvent` | Client sends local key/input event. Server relays as `keyEvent` to opponent.                    | Client to server |
| `playerPosition` | Client sends periodic local player position. Server relays to opponent.                         | Client to server |
| `obstacleDamage` | Client sends accepted obstacle damage. Server relays to opponent.                               | Client to server |
| `roundResult`    | Winning client reports a hit result. Server validates and updates score/phase.                  | Client to server |
| `requeue`        | Remaining abandoned client asks to return to matchmaking.                                       | Client to server |

## Names to reconsider

- `GameSession` and `game`: Good server terms, but product discussions should
  distinguish game session from match. Use `match` for the timed contest and
  `round` or `duel` for one kill cycle.
- `Player`: Ambiguous because the server has connected clients and the canvas
  engine has controllable avatar objects. In code discussions, say
  `PublicClient`, `LobbyClient`, `player id`, or `Controllable` when precision
  matters.
- `Round`: The product often means a duel, while the code also has client
  `roundState`. Use `roundNumber` for the duel count and `roundState` for
  client presentation state.
- `Shot`: Current event payload name for a bullet snapshot. `shotSnapshot` or
  `bulletSnapshot` would be clearer if this area is refactored.
- `syncStoredPlayerName`: This sounds harmless, but storage is browser-owned
  identity state. Be careful when model-sync code writes to storage.
- `shootingStraightness`: Accurate but slightly long. It means the player's
  current shot-quality value before firing; `straightness` alone belongs to a
  bullet after firing.
- `status`: Avoid adding new code named `status` for lifecycle. The server
  contract uses `phase`; lobby text uses `message` or derived presentation
  labels.
