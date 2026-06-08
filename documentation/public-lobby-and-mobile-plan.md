# Public Lobby And Mobile Plan

This plan covers the two changes needed before opening Gunfight to public visitors:

1. A simple retro lobby that pairs visitors into isolated two-player games.
2. Touch/mobile support from joining through playing.

The current app is close in spirit already: the waiting screen is the arcade lobby, and the canvas scales responsively. The bigger technical change is that the server currently has one global game model and broadcasts events to every connected socket. Public play needs room-scoped game state and room-scoped Socket.IO events.

## Current Shape

- `gameserver/server.js` serves the client and wires Socket.IO events.
- `gameserver/gameModules/gfmodel.js` stores one global list of clients, ready state, scenario index, and round number.
- `www/js/index.js` keeps most gameplay state in the browser and syncs input, positions, obstacle damage, ready state, and round advancement through Socket.IO.
- `www/js/KeysModel.js` maps keyboard input to the same `clientKeyEvent` format the game consumes locally and remotely.
- `www/css/index.css` already scales the 950 by 640 playfield into the viewport.

## Goals

- Every public visitor lands on the existing arcade waiting screen.
- Each playable game has exactly two active players.
- The server can host multiple simultaneous two-player games.
- Visitors can join, leave, disconnect, reconnect in a predictable way.
- Visitors get short generated names, and can change them before or while waiting.
- Touch users can ready up, move, aim, and shoot without a keyboard.
- The full playfield fits on small screens without camera scrolling.

## Non-Goals For The First Public Version

- Spectator mode.
- Private room codes.
- Skill-based matchmaking.
- Persistent accounts.
- Server-authoritative movement, bullets, or hit detection.

These can be added later, but they are not necessary to solve the public lobby.

## Proposed Lobby Model

Introduce a server-side lobby/session layer above the existing game model.

Core concepts:

- `Lobby`: tracks waiting visitors and active games.
- `GameSession`: owns one isolated two-player game model, Socket.IO room name, status, and timestamps.
- `Client`: owns socket id, player id within a game, display name, ready state, and last-seen timestamp.

Suggested statuses:

- `waiting`: one player is assigned to a game and waiting for an opponent.
- `readying`: two players are assigned; the arcade waiting screen shows both names and ready states.
- `playing`: both players have pressed play/ready and the round has started.
- `abandoned`: one player left mid-game.
- `closed`: session is cleaned up.

The waiting screen should remain the lobby UI. Instead of showing only `Player 1 : waiting`, it can show:

- The visitor's generated name.
- The opponent slot, either occupied or waiting.
- A blinking retro prompt such as `PRESS P TO PLAY` on keyboard and `TAP PLAY` on touch devices.
- A small name-change control outside or overlaid near the canvas, styled like an arcade service panel.

## Pairing Flow

1. Browser connects to Socket.IO.
2. Server creates or restores a `Client`.
3. Client sends or receives a display name.
4. Server assigns the client to the oldest open `waiting` game with one player.
5. If no open game exists, server creates a new `GameSession`.
6. Server joins the socket to that session's Socket.IO room.
7. Server emits `joinedGame` with `gameId`, `playerId`, `name`, `slot`, and the room-scoped model.
8. Server emits model updates only to that room.
9. When both players are present, each can press `P` or tap Play to ready.
10. When both are ready, the existing round ritual starts.

Important behavior:

- A third visitor must never be added to an active two-player game.
- If a player disconnects before the game starts, the remaining player returns to a one-player waiting state.
- If a player disconnects during a game, show an abandoned/opponent-left message and return the remaining player to matchmaking after a short delay.
- If both players leave, close the session immediately.

## Sequential Implementation Plan

### 1. Refactor The Game Model Into Instances

Refactor `gfmodel.js` so it can create independent model instances instead of using module-level globals.

Current global state to move into each game instance:

- `counter`
- `clients`
- `currentScenarioIndex`
- `roundNumber`

The module can export a factory such as `createGameModel()` with methods matching the current API:

- `addClient(client)`
- `disconnect(client)`
- `getModel()`
- `readyClient(client)`
- `resetReady()`
- `advanceRound()`

This is the foundation for multiple concurrent games. The goal is to change the server architecture while keeping the client protocol mostly stable.

### 2. Add A Session Manager

Add a small `gameserver/gameModules/lobby.js` or `sessions.js` module.

Responsibilities:

- Generate short game ids.
- Generate player ids scoped to a game.
- Generate default display names.
- Find or create waiting games.
- Move clients between sessions when needed.
- Clean up abandoned and empty games.
- Return room names for Socket.IO.

Initial name style can stay arcade-like and tiny:

- `ACE`
- `KID`
- `DOC`
- `RED`
- `JET`
- `MAX`

If names collide in the same game, append a small number: `ACE2`.

### 3. Scope All Socket Events To A Game Room

Update `gameserver/server.js` so every event is scoped to the client's `GameSession`.

Examples:

- Replace global `io.emit('modelUpdate', ...)` with `io.to(game.room).emit('modelUpdate', game.model.getModel())`.
- Replace `socket.broadcast.emit('keyEvent', ...)` with `socket.to(game.room).emit('keyEvent', ...)`.
- Ignore gameplay events from sockets that are not in an active assigned game.
- Validate that `advanceRound`, `resetReady`, and `clientReady` only mutate that client's own game.

This is the main safety line for multiple concurrent games. After this step, a third visitor should no longer see or affect an existing match.

### 4. Add Explicit Join, Leave, And Requeue Events

Add explicit client events:

- `joinLobby`: enter matchmaking, with optional saved name.
- `updateName`: set short display name.
- `leaveGame`: intentionally leave current game and return to lobby or disconnect.
- `requeue`: leave an abandoned/completed session and find another opponent.

For a first version, connecting can automatically call the equivalent of `joinLobby`, but having explicit events makes the lifecycle cleaner and easier to test.

### 5. Extend The Shared Game Model With Lobby State

Extend the model consumed by `www/js/index.js`:

- `gameId`
- `status`
- `clients: [{ id, ready, name }]`
- Optional `message`

This gives the waiting screen enough information to show names, opponent state, abandoned games, and matchmaking messages.

### 6. Update The Waiting Screen Into The Public Lobby

Keep `drawStartScreen()` as the primary lobby visual, but update it to use room-scoped names and statuses.

The screen should show:

- The visitor's generated name and player slot.
- The opponent slot, either occupied or waiting.
- Ready states for both players.
- A blinking retro prompt such as `PRESS P TO PLAY`.
- A touch-aware alternative such as `TAP PLAY` when touch controls are visible.

When the server reports `abandoned`, show an arcade message:

- `OPPONENT LEFT`
- `LOOKING FOR NEW CHALLENGER`

Then either auto-requeue after a delay or show a Play/Requeue button. Auto-requeue is probably better for public play.

### 7. Add Name Editing

Add a compact HTML overlay near the game stage:

- Short text input, max 3 to 8 characters.
- Randomize button.
- Save/update behavior that emits `updateName`.

Keep this visually quiet and arcade-like. It should not become a modern lobby panel that fights the game screen.

### 8. Add Server Tests For Pairing And Room Isolation

Add focused tests for session behavior:

- Two clients join the same game.
- A third client creates or joins a different game.
- Events from one game are not emitted to another game.
- Disconnect before ready frees the waiting slot.
- Disconnect during play abandons that game.
- Empty games are removed.

This should happen before touch work, because matchmaking bugs will be much harder to reason about once there are more input paths.

### 9. Harden The Mobile Viewport And Page Layout

Add mobile basics:

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `touch-action: none` on the game/touch control surface.
- Use modern viewport units such as `100dvh` where supported, with existing `100vh` fallback.
- Respect safe-area insets for controls.
- Prevent body scrolling while the game is active.

The current canvas wrapper already scales the 950 by 640 field to fit. We should preserve that.

About hiding the URL/tab bars: browsers do not let web apps directly force browser chrome away. The best practical options are:

- Make the page non-scrollable and fit within the dynamic viewport.
- Use `100dvh` so layout adapts when browser chrome collapses or expands.
- Support installed/PWA mode later if fullscreen-like behavior becomes important.
- Optionally call `requestFullscreen()` after a user tap, but this is browser-dependent and can be awkward on mobile.

### 10. Refactor Keyboard Input Into A Unified Input API

Refactor `KeysModel.js` into a more general input model that can emit the same events from keyboard and touch.

Suggested shape:

- Keep keyboard support exactly as-is.
- Add public methods like `press(key)`, `release(key)`, and `ready()`.
- Have keyboard listeners and touch controls both call those methods.

This keeps gameplay code from caring whether input came from keyboard or touch.

### 11. Add Touch Controls

Add an HTML touch overlay with large stable hit targets.

Needed controls:

- Join/ready: Play button mapped to `clientReady`.
- Move left: mapped to `h`.
- Move right: mapped to `l`.
- Aim up: mapped to `a`.
- Aim down: mapped to `z`.
- Shoot: mapped to Space.

The original keyboard also supports `j` and `k` for down/up movement. Current gameplay appears side-view and mainly horizontal, but if vertical movement is meaningful we should add a small four-way pad:

- Left: `h`
- Down: `j`
- Up: `k`
- Right: `l`

For touch ergonomics:

- Put movement on the lower left.
- Put aim and shoot on the lower right.
- Make shoot the largest action button.
- Use `pointerdown`, `pointerup`, `pointercancel`, and `lostpointercapture`.
- Emit key `down` once on press and key `up` once on release.
- Avoid duplicate events when a finger moves across controls.
- Keep controls hidden or reduced on desktop unless touch is detected.

### 12. Run Small-Screen And Multiplayer QA

Verify at least:

- 320 by 568 portrait.
- 375 by 667 portrait.
- 390 by 844 portrait.
- 667 by 375 landscape.
- 844 by 390 landscape.
- Desktop keyboard play.
- Two or three concurrent two-player games.

Checks:

- Canvas is fully visible.
- Touch controls do not cover essential HUD information.
- No text overlaps inside controls.
- Ready/join works by touch.
- Movement, aim, and shoot work by touch.
- Audio still warms up after first user interaction.
- Events from one game do not leak into another game.

### 13. Deploy To Staging And Run Public-Style Smoke Tests

Deploy to a staging or temporary public URL and test with real browsers on separate networks if possible.

Smoke-test:

- Two players can pair and complete a round.
- Four players become two separate games.
- A player can leave before ready.
- A player can leave during play.
- A new visitor can be paired after another game is abandoned.
- A touch device can join, ready, move, aim, and shoot.

## Concerns And Decisions To Make

- The game is currently mostly client-authoritative. For a public version, cheating and divergent game states are possible. This may be acceptable for a friendly arcade toy, but public competitive play would eventually need more server authority.
- Hit detection is performed locally, and the winner advances the round. In split rooms this remains workable, but latency or disagreements between clients can still happen.
- Reconnection needs a product decision. The simple version treats disconnect as leaving. A nicer version gives players 10 to 20 seconds to reconnect to the same game.
- Mobile portrait may fit the field, but touch controls will compete for space. Landscape will likely feel much better. We can support portrait, but we may want a subtle rotate hint if the controls feel cramped.
- Browser fullscreen and URL bar behavior cannot be guaranteed. We can make the app respond well to browser chrome changes, but we should not depend on hiding chrome.
- Name editing should be constrained and sanitized. Short uppercase ASCII names are easiest to render cleanly in the existing arcade font.
- Public matchmaking needs cleanup timers so abandoned sessions do not accumulate forever.
- We should decide whether visitors waiting alone should see themselves as `Player 1` or just as their chosen name. My preference is to show both: `ACE - PLAYER 1`.
- The current server has no rate limiting. For public exposure, we may want basic connection limits, payload validation, and logging before launch.

## First Implementation Slice

The safest first slice is server-only plus a minimal client update:

- Create isolated game sessions.
- Pair only two players per game.
- Scope all existing Socket.IO events to that game room.
- Keep the current waiting screen and `P` behavior.
- Add generated names to the model and display them.

Once that works, touch controls can be added without also debugging matchmaking.
