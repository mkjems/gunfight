# Gunfight TODO2

## P1 - Code Architecture

### P1.4.11 - Choose And Spike A Component Renderer

- [x] Compare vanilla DOM modules, Preact, Lit, and Svelte/Solid against this project.
- [x] Prefer Preact unless the spike shows it adds more complexity than it removes.
- [x] Add the smallest possible Preact island behind the existing HUD overlay.
- [x] Migrate one low-risk screen first, likely high scores.
- [x] Verify build, browser smoke test, service worker behavior, and mobile layout.

### P1.4.12 - Migrate UI Screens To Components Incrementally

- [x] Convert high scores screen first.
- [x] Convert lobby screen after high scores.
- [x] Convert name editor after lobby.
- [x] Convert game HUD last because it is closest to active gameplay.
- [x] Remove old imperative DOM screen modules only after their replacement is covered by tests.
    - [x] Port the screen unit tests to the Preact component screens.
        - Render with happy-dom and assert on rendered DOM output.
        - Keep the on-the-fly transpile pattern with the Preact JSX runtime.
    - [x] Delete `gameHud.ts`, `highScoresScreen.ts`, `lobbyScreen.ts`, and `nameEditorScreen.ts`.
    - [x] Delete the old `clientHudScreens.test.js` in the same change.
- [x] Convert touch controls after the screen/HUD component boundary is stable.
    - Keep joystick, aim, and fire input state in the existing input/touch flow modules.
    - [x] Convert the touch lobby buttons first; they are plain render-props-and-actions buttons like the converted screens.
    - [x] Spike per-frame joystick/aim rendering before converting gameplay controls.
        - Finding: HUD and touch flows already render every frame, so component screens now skip virtual-DOM work when render props are value-equal.
        - Decision: knob and aim handle positions stay imperative element updates, never render props. See the per-frame rendering rule in `documentation/UI-ownership.md`.
    - [x] Convert the joystick, aim slider, and fire button, forwarding pointer events to the existing touch flow modules.
        - The component owns static markup and visibility props only; pointer listeners, knob transforms, and aim handle positions stay imperative in the touch input module.

### P1.4.12.2 - Unify The Client UI Into One Preact Root

Goal: stop filling islands of DOM. The client UI becomes one Preact app
      rendered into a single root element, so components express composition and
      rich interfaces instead of renting containers. The canvases stay outside the
      component tree.

Goal: Implement good code architecture so we have a nice expressive way to write user interface and also a speedy gameplay, and fluent virtual touch controls. 
      The app is a SPA with websocket connection to the server.
      We want the socket events to be able to send control messages to the Preact app that will affect the state, and the render tree off the preact app.

- [ ] Render the whole DOM UI from a single app root.
    - Replace the per-screen containers in `index.html` with one app root element.
    - Render one app component from one guarded render call.
    - Keep the gameplay canvas and HUD canvas as static elements outside the app.
- [ ] Build a single overlay view model.
    - Flows assemble one props tree: active screen plus per-screen props.
    - Keep `ClientScreens` as the only owner of the active-screen decision.
    - Keep the per-frame rendering rule: one value-equality check per frame, Preact idles when nothing changed.
- [ ] Replace screen wrapper classes with plain components composed in JSX.
    - Screen selection becomes declarative composition in the app component, not hidden-flag side effects.
    - Collapse `ClientUi`/`ClientHudOverlay` element wiring into the app mount.
    - Update screen unit tests to render components through the app root with view-model props.
- [ ] Convert the rotate prompt to a component.
    - It is CSS/orientation driven, so the component is markup only.
- [ ] Convert the install prompt to a component.
    - Keep `beforeinstallprompt` handling, service worker registration, and dismiss persistence in the existing module.
    - The component renders markup and emits install/dismiss actions.
- [ ] Keep touch gameplay controls mounted and imperative inside the app.
    - The joystick/aim/fire subtree stays always mounted with visibility props so imperatively bound pointer listeners and styles survive re-renders.
    - Re-acquire element references after the first app render.
- [ ] Verify layout, PWA behavior, and update the architecture docs.
    - Verify mobile layout, touch positioning over the canvas, and service worker behavior.
    - Update `documentation/UI-ownership.md` and `documentation/Architecture-flow.md` to the single-root model.

### P1.5 - Tighten The Canvas Gameplay Core

- [ ] Treat canvas gameplay as a small imperative game engine behind the component UI.
    - Keep canvas rendering, simulation, input application, hit detection, and round flow outside the component renderer.
    - Make DOM components observe gameplay state through view models and explicit render props.
    - Avoid moving active gameplay loops into UI component state.

- [ ] Type the remaining `game.ts` runtime state.
    - Replace broad `any` fields for canvas surfaces, assets, systems, socket, model, players, bullets, ammo, timers, and round data with named contracts.
    - Keep browser dependencies injectable for startup tests.
    - Prefer small local contracts over importing concrete classes everywhere.

- [ ] Split the large `createGame` closure into a runtime object when the seams are clearer.
    - Keep startup, state accessors, network callbacks, input startup, frame update/render, and round orchestration easy to scan separately.
    - Preserve the current grouped runtime dependency shape.
    - Avoid behavior changes while extracting the runtime shape.

- [ ] Normalize factory and constructor conventions in gameplay modules.
    - Decide where function factories are intentional and where classes are clearer.
    - Keep module exports consistent enough that runtime wiring does not need unnecessary casts.
    - Update tests alongside each conversion.

- [ ] Strengthen gameplay regression coverage before deeper canvas changes.
    - Cover frame update order, camera use, player/bullet lifecycle, obstacle collision environment updates, hit pause, round reset, and match end.
    - Add focused tests for edge cases before refactoring the code that owns them.
    - Keep browser smoke tests as the full-app wiring guard.


## P2 - Lobby redesign

- [ ] Show main lobby screen for 30 secs and high score screen for only 7 secs 
- [ ] Do not show game ID in the main-lobby. Remove line 

- [ ] Implement new design for lobby from image
- [ ] Do not show characters in the background on the high-scores-page. 


## P3 - Content Authoring Tools

### P3.1 Add a rock editor page.
- [ ] Add a rock editor page.
    - [ ] Provide a WYSIWYG preview for rock dimensions and polygon shape.
    - [ ] Accept rock JSON as input.
    - [ ] Output rock JSON for copying into project data.
    - [ ] Validate JSON and geometry with readable errors.

## P3.5 Add a scenario editor page. 
- [ ] Add a scenario editor page.
    - [ ] Provide a WYSIWYG preview of the full arena scenario.
    - [ ] Let the user place and adjust rocks, cacti, wagons, saloons, decorations, and player start positions.
    - [ ] Accept scenario JSON as input.
    - [ ] Output scenario JSON for copying into project data.
    - [ ] Validate JSON and scenario geometry with readable errors.

## P4 - Later Ideas
- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
