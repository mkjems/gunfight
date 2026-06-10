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
- Mobile gameplay feels full-screen by using a virtual camera that follows the local player instead of shrinking the whole playfield.

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
- An arcade-native name editor entered with `E`, using the existing movement/select controls.

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

Progress note:

- Steps 1 through 14 are implemented in the current working app, with local small-screen and two-client QA completed.
- The next implementation slice should focus on getting the Hetzner VPS serving the game over HTTPS at `gunfight.mkjems.dk`.

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

Keep the existing arcade waiting screen as the primary lobby visual, but render its text with the HTML overlay and update it to use room-scoped names and statuses.

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

Add an arcade-native name editor instead of a normal web form.

Expected behavior:

- Lobby shows `PRESS E TO EDIT NAME`.
- Pressing `E` switches the lobby into name-entry mode.
- `h j k l` move a highlight through a matrix of letters/actions.
- Space selects a character or action.
- Include letters, numbers, backspace, random, and OK.
- Finishing emits `updateName`.

Keep this inside a separate client module so the main game loop only delegates input and drawing.

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
- Keep the desktop browser view as a centered arcade cabinet without scrollbars.
- Prefer home-screen/PWA mode for mobile play, because browser chrome makes the canvas feel too small.
- Add install metadata and a retro install hint for mobile visitors.
- Keep page-level touch/scroll rules conservative until touch controls exist, so mobile browsers do not feel trapped.

The current canvas wrapper already scales the 950 by 640 field to fit. That remains useful for desktop and lobby views, but it is not enough for convincing mobile gameplay.

About hiding the URL/tab bars: browsers do not let web apps directly force browser chrome away. The best practical options are:

- Support installed/PWA mode and guide users to launch from the home screen.
- Optionally call `requestFullscreen()` after a user tap, but this is browser-dependent and can be awkward on mobile.
- Set up HTTPS on the production Hetzner VPS before launch so PWA install and service worker behavior are reliable on the public domain.

### 10. Add A Virtual Camera For Mobile Gameplay

Add a camera/viewport layer so mobile can show a zoomed-in part of the arena instead of shrinking the entire 950 by 640 playfield.

Expected behavior:

- Desktop can keep the full-board view by default.
- Mobile/touch gameplay uses a scale factor that makes the player, bullets, obstacles, and touch controls readable.
- Camera follows the local player during active gameplay.
- Camera is clamped to world bounds so it does not show outside the arena.
- Camera movement should be smoothed enough to feel stable, but responsive enough that the player never outruns the view.
- Remote player, bullets, obstacles, collision debug drawing, and hit messages must all draw through the same world-to-screen transform.
- HUD/lobby text can remain screen-space rather than world-space.
- Waiting/lobby can continue to show the full board unless the mobile design feels better with the same camera treatment.

Implementation notes:

- Introduce a small client module such as `Camera.js`.
- Keep world coordinates unchanged for physics, collision, networking, and server events.
- Apply camera transforms only in rendering and pointer/touch interpretation.
- Start with a simple local-player follow camera before adding predictive lookahead or opponent-aware framing.
- Add a debug toggle or helper to compare full-board and camera views while tuning.

### 11. Refactor Keyboard Input Into A Unified Input API

Refactor `KeysModel.js` into a more general input model that can emit the same events from keyboard and touch.

Suggested shape:

- Keep keyboard support exactly as-is.
- Add public methods like `press(key)`, `release(key)`, and `ready()`.
- Have keyboard listeners and touch controls both call those methods.

This keeps gameplay code from caring whether input came from keyboard or touch.

### 12. Add Touch Controls

Add an HTML touch overlay with large stable hit targets.

Implemented controls:

- Lobby: `EDIT` maps to `e`; `PLAY` maps to ready.
- Name editor: left-side joystick maps to `h`, `j`, `k`, `l`; `FIRE` maps to Space for selecting letters.
- Gameplay movement: left-side virtual joystick maps to `h`, `j`, `k`, `l`.
- Gameplay aiming: right-side vertical slider maps to repeated `a`/`z` input.
- Gameplay shooting: right-side `FIRE` button maps to Space.

For touch ergonomics:

- Put movement on the lower left.
- Put aim and shoot on the lower right.
- Keep the overlay HTML/CSS separate from canvas rendering.
- Keep the input mapping inside `TouchControls.js`, with gameplay using the unified `KeysModel` input API.

Follow-up tuning after real-device testing:

- Tune joystick size/deadzone.
- Tune aim slider direction and travel.
- Adjust control positions for iPhone safe areas and PWA full-screen mode.
- Make shoot the largest action button.
- Use `pointerdown`, `pointerup`, `pointercancel`, and `lostpointercapture`.
- Emit key `down` once on press and key `up` once on release.
- Avoid duplicate events when a finger moves across controls.
- Keep controls hidden or reduced on desktop unless touch is detected.
- Account for the virtual camera when interpreting any touch input that maps to world-space intent.

### 13. Move Lobby And HUD Text To HTML

Move all screen text out of canvas drawing and into regular HTML elements. Text is easier to inspect, style, test, and adapt for mobile when it is normal DOM text instead of canvas pixels.

Expected behavior:

- Lobby, ready state, prompts, round timer, scores, ammo/HUD labels, hit messages, install messages, and name editor text should render as HTML.
- The canvas should remain responsible for game-world visuals: players, bullets, obstacles, scenery, and effects.
- HTML text should live inside the same `#gameStage` / canvas box so it follows the scaled playfield exactly.
- Text layout should use normal responsive HTML/CSS layout: flexbox, grid, logical groups, gaps, alignment, and padding.
- Do not use canvas-style coordinate placement for text, such as `x: 475, y: 132`, unless a specific gameplay effect truly needs absolute positioning.
- Do not position gameplay/lobby text relative to the browser viewport unless the intended behavior is truly viewport-level UI.
- Keep the HTML overlay separate from touch controls so prompts, controls, and install messaging can be shown or hidden independently.

Touch/mobile text behavior:

- Do not show desktop keyboard instructions to touch-device users.
- Show touch-specific prompts such as `TAP PLAY` or visible action buttons instead of `PRESS P`, `PRESS E`, and keyboard movement instructions.
- When the add-to-home-screen/install message is visible, it should be the only message on screen. Hide lobby prompts and other instructional text until the install message is dismissed or no longer relevant.

Name editor behavior:

- Keep the virtual arcade keyboard for mobile because it fits the game style.
- Also allow touch users to tap the on-screen letter/action buttons directly.
- When entering the edit-name screen, start with an empty input field.
- If the user actively submits an empty name, keep the existing default-name behavior and assign a generated fallback name.

Implementation notes:

- Add a DOM overlay inside `#gameStage`, likely between the canvases and `#touchControls`, for text/HUD elements.
- Keep overlay dimensions locked to the canvas aspect ratio through the existing `#gameStage` scaling.
- Convert existing `drawHudText()` call sites into semantic overlay regions, such as lobby header, controls, player status, prompts, score row, timer, ammo row, hit message, and name editor.
- Use CSS grid/flex layouts for those regions instead of preserving the old canvas text coordinates.
- Replace canvas-drawn name-editor rectangles/text with HTML buttons that support keyboard focus, keyboard selection, joystick selection, and direct tapping.
- Ensure pointer events are enabled only where elements are interactive; passive labels should not block gameplay controls.

### 14. Run Small-Screen And Multiplayer QA

Verify at least:

- 320 by 568 portrait.
- 375 by 667 portrait.
- 390 by 844 portrait.
- 667 by 375 landscape.
- 844 by 390 landscape.
- Desktop keyboard play.
- Two or three concurrent two-player games.
- Installed PWA/home-screen launch on iPhone.
- Installed PWA/home-screen launch or browser install flow on Android.

Checks:

- Desktop canvas is fully visible.
- Mobile gameplay is readable with the virtual camera enabled.
- Camera follows the local player and clamps at arena edges.
- Bullets, obstacles, hit messages, and both players draw correctly through the camera.
- Touch controls do not cover essential HUD information.
- No text overlaps inside controls.
- HTML text follows the canvas box exactly on desktop, mobile portrait, and mobile landscape.
- Touch devices do not show desktop keyboard instructions.
- Name editor works by keyboard, virtual joystick/select, and direct tapping.
- Entering name edit starts with an empty input, while submitting empty still produces a generated fallback name.
- Install/add-to-home-screen messaging hides other lobby messages while visible.
- Ready/join works by touch.
- Movement, aim, and shoot work by touch.
- Audio still warms up after first user interaction.
- Events from one game do not leak into another game.

### 15. Configure Hetzner VPS HTTPS For Mobile Testing

The next goal is to make Gunfight run on a mobile device at:

- `https://gunfight.mkjems.dk`

This step is intentionally limited to the production-style hosting foundation. More public-play specifications, smoke tests, and real-device acceptance tests should be planned separately afterwards.

Required outcome:

- DNS for `gunfight.mkjems.dk` points to the Hetzner VPS.
- The game server is reachable behind a reverse proxy on the VPS.
- HTTPS is enabled with a valid certificate for `gunfight.mkjems.dk`.
- HTTP redirects to HTTPS.
- Socket.IO works over HTTPS/WSS.
- The mobile browser no longer shows `Not Secure`.
- The install/PWA path can be tested from the real domain.

Why HTTPS matters here:

- Mobile browsers require a secure context for service workers and reliable PWA install behavior.
- iPhone/Android home-screen testing is only meaningful once the game is served from the real HTTPS domain.

## Concerns And Decisions To Make

- The game is currently mostly client-authoritative. For a public version, cheating and divergent game states are possible. This may be acceptable for a friendly arcade toy, but public competitive play would eventually need more server authority.
- Hit detection is performed locally, and the winner advances the round. In split rooms this remains workable, but latency or disagreements between clients can still happen.
- Reconnection needs a product decision. The simple version treats disconnect as leaving. A nicer version gives players 10 to 20 seconds to reconnect to the same game.
- Mobile portrait can technically fit the board, but shrinking the whole board is not convincing. A virtual camera is likely needed for satisfying mobile play.
- Camera-follow changes how much battlefield information a player sees. We need to decide whether this is mobile-only, touch-only, or also an optional desktop mode.
- Browser fullscreen and URL bar behavior cannot be guaranteed. The production path should be HTTPS plus PWA/home-screen launch, with browser play treated as a fallback.
- Name editing should be constrained and sanitized. Short uppercase ASCII names are easiest to render cleanly in the existing arcade font.
- Public matchmaking needs cleanup timers so abandoned sessions do not accumulate forever.
- We should decide whether visitors waiting alone should see themselves as `Player 1` or just as their chosen name. My preference is to show both: `ACE - PLAYER 1`.
- The current server has no rate limiting. For public exposure, we may want basic connection limits, payload validation, and logging before launch.
- The Hetzner VPS needs HTTPS configured before public PWA testing and launch.

## First Implementation Slice

The safest first slice is server-only plus a minimal client update:

- Create isolated game sessions.
- Pair only two players per game.
- Scope all existing Socket.IO events to that game room.
- Keep the current waiting screen and `P` behavior.
- Add generated names to the model and display them.

Once that works, touch controls can be added without also debugging matchmaking.
