# UI Ownership Boundary

This document defines what a future component renderer may own. It is the
architecture contract for P1.4.10 and the guardrail for P1.4.11 through P1.4.13.

## Goal

Move the DOM UI toward components without moving gameplay into the component
tree. The game should keep its fast, imperative canvas loop while lobby, HUD,
high score, and name-editor markup become easier to render and test.

## Ownership

### Canvas gameplay stays outside components

The component framework must not own:

- The main gameplay canvas.
- The HUD canvas used for canvas-drawn overlays such as ammo.
- The game loop and animation frame scheduling.
- Player, bullet, scene, obstacle, collision, camera, score, ammo, timer, and
  round simulation objects.
- Socket.IO synchronization and relayed gameplay events.

These systems stay in focused client modules and continue to be coordinated by
the game bootstrap and flow modules.

### Components may own the DOM overlay

The component-owned area is the DOM overlay rendered around the canvas:

- Game HUD DOM labels and round messages.
- Lobby main screen.
- High scores screen.
- Name editor screen.
- Mobile touch controls, including the virtual joystick, aim slider, fire
  button, and touch lobby buttons.

The first component island should attach behind the existing HUD overlay
boundary. It should replace one screen at a time, starting with the lowest-risk
screen. Touch controls are part of the eventual component-owned DOM surface, but
they should stay outside the first component migration until the safer overlay
screens prove the boundary.

### Flow modules choose when rendering happens

Flow modules keep orchestration ownership:

- `ClientHudFlow` decides whether the active frame renders lobby UI or gameplay
  UI.
- `ClientLobbyHudFlow` decides which lobby-family screen is active.
- `ClientScreens` owns legal round states, screen names, and screen selection.
- Round, lobby, model-update, input, touch, and network flows keep side effects.

Components should not start timers, transition round state, send socket events,
or decide whether a screen transition is legal.

### View-model modules stay framework-independent

View-model modules are the bridge between game state and rendering:

- `ClientLobbyViewModel` derives lobby text, slots, and prompts.
- `GameHudViewModel` derives scores, timer labels, round messages, and hit
  message positions.
- Future view-model helpers should remain plain TypeScript functions.

View models should not import Preact or any other component framework. They
should accept plain data and return plain data.

## Component Contract

Components receive render props and emit actions.

Render props are plain values such as:

- Active screen.
- Lobby lines, slots, and prompts.
- High score rows.
- Name editor grid state.
- Game HUD labels and hit message position.
- Touch/mobile presentation flags when those controls later enter the component
  boundary.

Actions are callbacks supplied by orchestration, such as:

- Select a name-editor key.
- Request name-editor close.
- Request play or ready.
- Request edit-name mode.
- Report touch joystick, aim, and fire input through existing input flows.

Components may keep only local presentation state that does not affect gameplay
or synchronization, such as focus hints or pointer hover state. Persistent UI
state, gameplay state, player identity, round state, network state, touch input
state, and name editor value state must stay in the existing client state
modules.

## Data Flow

The preferred flow is:

1. Server and local systems update game/client state.
2. Flow modules decide what needs rendering.
3. View-model modules derive plain render props.
4. Components render DOM from those props.
5. User interaction emits callbacks back to flow modules.
6. Flow modules update state, send socket events, or trigger another render.

Components sit at the end of the render path. They do not become a second state
manager.

## Migration Rule

When replacing an imperative DOM screen with a component:

- Keep the old screen module behavior covered by tests first.
- Move only one screen at a time.
- Migrate touch controls after the lobby, high scores, name editor, and game HUD
  component boundary is stable.
- Preserve the existing view-model contract unless the test shows the contract
  is wrong.
- Keep `ClientScreens` as the only owner of screen-state decisions.
- Remove the old imperative DOM module only after the component replacement is
  wired into the same flow and tests pass.

## Current Boundary

The current implementation still uses imperative DOM screen modules. That is
acceptable during the migration. The architectural boundary is now:

- Imperative gameplay and flow modules own state, timing, and side effects.
- Framework-independent view models own render decisions.
- Future components own DOM markup and event wiring inside the overlay.

## Renderer Spike Choice

P1.4.11 chose Preact for the first component island.

- Vanilla DOM modules fit the current code and remain useful as migration
  references, but they keep markup updates spread across manual DOM operations.
- Lit has a good web-component boundary, but custom element lifecycle and shadow
  DOM choices are more machinery than this overlay needs right now.
- Svelte and Solid are appealing for full component apps, but they add a larger
  compiler/framework decision before the project has enough component surface to
  justify it.
- Preact gives the smallest practical island inside the existing Vite build,
  with component rendering for DOM overlays while canvas gameplay stays
  imperative.

The first runtime islands are the high scores screen table/prompt, the lobby
screen sections, and the name editor screen behind the existing
`ClientHudOverlay` boundary. The old imperative screen modules can stay as
references until the rest of P1.4.12 removes obsolete screen modules.
