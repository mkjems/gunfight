# Gunfight TODO

## P1 - Code Architecture

Goal: move the client toward TypeScript and componentized UI without stopping normal feature work. Each step should leave the game playable and easier to change than before.

### P1.1 - Stabilize The Current Code

- [x] Add code formatting and linting.
    - Pick one formatter.
    - Add lint rules that catch accidental globals and unsafe equality.
    - Run checks in CI before deploy.

- [x] Add lightweight type checking before converting files.
    - Enable `checkJs` for JavaScript where practical.
    - Add JSDoc typedefs for the most important shared shapes.
    - Start with Socket.IO payloads, public game model, high score rows, scenarios, obstacles, players, bullets, and round state.

- [x] Document current client state ownership.
    - List which state is owned by the server, which is owned by the browser, and which is relayed between players.
    - Keep this near the implementation or in `documentation/` so later refactors have a map.

### P1.1.5 - Move Tooling To The Repo Root

- [x] Move the project package to the repository root.
    - Move `package.json`, `package-lock.json`, and `tsconfig.json` to the root.
    - Make root-level commands work naturally: `npm run dev`, `npm run check`, and `npm test`.
    - Keep this as a structural move with no gameplay behavior changes.

- [x] Rename the main app folders for the TypeScript/component path.
    - Move server code to `server/`.
    - Move browser client code to `client/`.
    - Add `shared/` when shared contracts are ready to move out of client-only code.

- [x] Update paths after the move.
    - Update server static-file paths.
    - Update Dockerfile and compose paths.
    - Update GitHub Actions paths and cache settings.
    - Update formatter, linter, and type-check includes.
    - Verify browser asset paths still resolve from the served client root.

### P1.2 - Make Screens And State Explicit

- [x] Create an explicit client state model.
    - Define states such as lobby, name editing, high scores, round intro, playing, hit pause, game over, and abandoned.
    - Make legal state transitions visible in one place.
    - Avoid scattered checks against string state values.

- [x] Add a small screen controller.
    - Decide the active screen from client state instead of hiding/showing screens in many places.
    - Keep the four main specification screens visible in code: Lobby-main, Lobby-Edit-name, Game, and High scores.
    - Keep screen selection separate from screen rendering.

- [x] Extract the high scores screen first.
    - Move high score table rendering out of `index.js`.
    - Give it a small input contract: rows, visible state, and prompt state.
    - Use this as the first example for future UI components.

### P1.3 - Split The Client Into Focused Modules

- [x] Keep `index.js` as orchestration only.
    - It should initialize systems, wire them together, and start the loop.
    - It should not contain detailed rendering for lobby, high scores, name editor, game HUD, sound, networking, or input.

- [x] Move UI into small component-like modules.
    - Create focused renderers for lobby, high scores, name editor, game HUD, install prompt, and touch controls.
    - Each UI module should own its DOM lookups and rendering for one screen or panel.
    - Prefer plain lightweight components first; do not move canvas gameplay into a component framework.

- [x] Move non-UI systems into focused modules.
    - [x] Extract networking.
    - [x] Keep keyboard and touch input in focused modules.
    - [x] Extract sound.
    - [x] Extract gameplay sound mapping.
    - [x] Extract ammo handling.
    - [x] Extract ammo reload flow.
    - [x] Extract gameplay key handling.
    - [x] Extract key-event routing flow.
    - [x] Extract input startup flow.
    - [x] Extract hit detection.
    - [x] Extract player-hit flow.
    - [x] Extract ammo HUD rendering.
    - [x] Extract HUD render orchestration.
    - [x] Extract HUD overlay component setup.
    - [x] Extract game HUD view-model decisions.
    - [x] Extract lobby HUD screen routing.
    - [x] Extract canvas utilities.
    - [x] Extract canvas surface setup.
    - [x] Extract client asset loading.
    - [x] Extract lobby view-model decisions.
    - [x] Extract camera and viewport decisions.
    - [x] Extract touch-control state decisions.
    - [x] Extract touch-control update flow.
    - [x] Extract touch-interface detection.
    - [x] Extract client identity and name-editor sync.
    - [x] Extract name-editor submit and close flow.
    - [x] Extract lobby entry and abandoned-game recovery flow.
    - [x] Extract match-end timer scheduling.
    - [x] Extract model update side-effect flow.
    - [x] Extract model-update planning.
    - [x] Extract game loop runner.
    - [x] Extract game system construction.
    - [x] Extract frame update and render flow.
    - [x] Extract round intro flow.
    - [x] Extract round ritual orchestration.
    - [x] Extract round timer bookkeeping.
    - [x] Extract round state data and flags.
    - [x] Extract round transition guard.
    - [x] Extract round ending flow.
    - [x] Extract round reset flow.
    - [x] Extract round state orchestration.
    - [x] Extract score handling.
    - [x] Extract client synchronization.
    - [x] Extract player position synchronization.
    - [x] Extract obstacle damage synchronization.
    - [x] Extract scenario rendering and obstacle geometry.
    - [x] Extract collision environment updates.
    - [x] Extract collision debug rendering.
    - Keep rendering, simulation, round flow, and network synchronization easy to reason about separately.

- [x] Reduce global namespace coupling for the current static-script setup.
    - Keep module boundaries explicit.
    - Make dependencies injectable for tests where practical.
    - Leave broad `GF.*` to imports replacement for P1.4 once a build step exists.

### P1.4 - Introduce TypeScript Deliberately

- [x] Decide on the TypeScript migration path.
    - Prefer an incremental migration over a full rewrite.
    - Move shared model and networking files first.
    - Then move extracted UI components and state modules.
    - Convert gameplay simulation files after the public contracts are stable.
    - Replace broad `GF.*` namespace mutation with imports after the build step exists.

- [x] Introduce typed data contracts.
    - Type Socket.IO payloads.
    - Type client, game model, scenario, obstacle, player, bullet, score, and screen-state shapes.
    - Validate incoming server and client payloads at runtime where needed.

- [x] Decide on a build tool before `.ts` files become normal.
    - Consider Vite for module bundling, dev server, cache-busted builds, and TypeScript support.
    - Keep the current static-file setup until bundling solves real pain.
    - Make sure service worker caching and deployment stay simple.

### P1.4.5 - Stabilize Shared And Server Types

- [x] Make shared contracts the single source of truth.
    - Keep public game, client, scenario, obstacle, bullet, score, and Socket.IO payload shapes in `shared/`.
    - Replace duplicate local typedefs with imports from shared contracts.
    - Keep browser-only state types separate from server-owned public contracts.

- [x] Strengthen server module annotations.
    - Type lobby inputs, outputs, game sessions, and public models.
    - Type high score game results and table rows.
    - Type game model clients, round numbers, and resolved scenarios.
    - Treat incoming socket data as `unknown` until normalized.

- [x] Validate JSON-backed game content.
    - Add runtime validation for `server/scenarios.json`.
    - Add runtime validation for `server/rocks.json`.
    - Keep source JSON types separate from resolved runtime scenario types.
    - Fail clearly when authoring data is malformed.

- [x] Tighten type checking gradually.
    - Extend `checkJs` coverage only where it is useful and stable.
    - Try stricter TypeScript flags on `shared/` first.
    - Convert `shared/` to `.ts` only after the contracts stop moving.

### P1.4.6 - Add A Server TypeScript Build And Convert Shared/Server Files

- [x] Add a server/shared TypeScript build step.
    - Compile server and shared `.ts` files with `tsc`.
    - Emit JavaScript in a predictable build output folder such as `dist/`.
    - Keep this separate from the later browser/Vite build step.
    - Do not make production depend on runtime TypeScript transpilation.

- [x] Convert shared contracts first.
    - Rename stable shared contract files from `.js` to `.ts`.
    - Keep runtime validators next to their exported types.
    - Import compiled shared contracts from compiled server code.

- [x] Convert server modules incrementally.
    - Start with high scores, lobby, and game model modules.
    - Keep Express and Socket.IO entrypoints working during each step.
    - Avoid changing gameplay behavior during type-only conversions.

- [x] Update server scripts and deployment.
    - Add build, start, dev, check, and test commands that work with compiled server output.
    - Run production with Node against compiled JavaScript, not `.ts` sources.
    - Update Dockerfile and compose commands if build output paths change.
    - Keep local development simple.

### P1.4.7 - Introduce A Client Browser Build Step

- [x] Add a browser build tool only when client imports are ready.
    - Prefer Vite unless a simpler tool fits the static app better.
    - Do not treat the P1.4.6 server TypeScript build as the browser build step.
    - Keep Socket.IO client loading, PWA manifest, service worker, and assets working.
    - Keep first-build asset names stable until hashed service-worker manifest generation is useful.

- [x] Move the browser entrypoint to modules.
    - Replace ordered script tags with a single built entrypoint.
    - Keep shared contracts available for later client imports where useful.
    - Keep the first bundled version visually and behaviorally identical.

### P1.4.7.5 - Add A Browser Build Smoke Test

- [x] Add a small Playwright smoke test before client module conversion.
    - Start the built server from `dist/`.
    - Open the built app on an isolated smoke-test localhost port.
    - Fail on browser page errors and console errors.
    - Assert the lobby or HUD becomes visible so the app is actually started.
    - Keep this as a narrow build/startup guardrail, not the full P4 browser test suite.

### P1.4.8 - Convert Client Modules Incrementally

- [x] Replace broad `GF.*` namespace mutation with imports.
    - [x] Move `ClientScreens` behind an imported module bridge first.
    - [x] Move `ClientLobbyViewModel` behind an imported module bridge.
    - [x] Move `GameHudViewModel` behind an imported module bridge.
    - [x] Move `ClientTouchEnvironment`, `ClientTouchState`, and `ClientRoundTransition` behind imported module bridges.
    - [x] Move `ClientMatchTimer` and `ClientRoundState` behind imported module bridges.
    - [x] Move `ClientModelSync` and `ClientTimers` behind imported module bridges.
    - [x] Move `Config` and `ClientModelUpdatePlan` behind imported module bridges.
    - [x] Move `ClientModelUpdateFlow` behind an imported module bridge.
    - [x] Move `ClientAssets`, `ClientGameSounds`, and `ClientIdentity` behind imported module bridges.
    - [x] Move `CanvasTools`, `ClientCanvasSetup`, and `ClientCameraController` behind imported module bridges.
    - [x] Move `ClientAmmo`, `ClientAmmoFlow`, `PlayerPositionSync`, and `ClientObstacleSync` behind imported module bridges.
    - [x] Move `ClientGameLoop`, `ClientFrameFlow`, `ClientGameSystems`, and `ClientInputStartup` behind imported module bridges.
    - [x] Move `ClientHudFlow`, `ClientHudOverlay`, `ClientLobbyHudFlow`, and `ClientNameEditorFlow` behind imported module bridges.
    - [x] Move `ClientGameplayInput`, `ClientKeyEventFlow`, `ClientTouchControlsFlow`, and `ClientNetwork` behind imported module bridges.
    - [x] Move `ClientHitDetection`, `ClientPlayerHitFlow`, `ClientRoundEndFlow`, and `ClientRoundResetFlow` behind imported module bridges.
    - [x] Move `ClientRoundRitual`, `ClientLobbyFlow`, `ClientCollisionEnvironment`, and `CollisionDebugRenderer` behind imported module bridges.
    - [x] Move `GameHud`, `HighScoresScreen`, `LobbyScreen`, and `NameEditorScreen` behind imported module bridges.
    - [x] Move `AmmoHudRenderer`, `InstallPrompt`, `Color`, `Pen`, and `requestAnimFrame` behind imported module bridges.
    - [x] Move `KeysModel`, `NameEditor`, `ScoreKeeper`, and `RoundIntro` behind imported module bridges.
    - [x] Move `Camera`, `SoundEffects`, and `TouchControls` behind imported module bridges.
    - [x] Move `Scene`, `Obstacles`, `Collision`, and `ScenarioRenderer` behind imported module bridges.
    - [x] Move `Bullet`, `Bullets`, `Controllable`, `Players`, and game startup behind imported module bridges.
    - [x] Retire the `client/js` static-script compatibility path.
    - [x] Remove the remaining `GF` compatibility surface from `main.js` and `game.ts`.

- [x] Convert browser files to TypeScript in low-risk groups.
    - [x] Convert `ClientScreens` to TypeScript as the first pure decision module.
    - [x] Convert `ClientLobbyViewModel` to TypeScript as the first view-model helper.
    - [x] Convert `GameHudViewModel` to TypeScript as the first HUD view-model helper.
    - [x] Convert touch-state and round-transition decision helpers to TypeScript.
    - [x] Convert match timer and round data state helpers to TypeScript.
    - [x] Convert model sync and timer utility helpers to TypeScript.
    - [x] Convert shared client config and model update planning to TypeScript.
    - [x] Convert model update side-effect orchestration to TypeScript.
    - [x] Convert asset loading, gameplay sound mapping, and identity helpers to TypeScript.
    - [x] Convert canvas setup/tools and camera controller helpers to TypeScript.
    - [x] Convert ammo and lightweight synchronization helpers to TypeScript.
    - [x] Convert game loop, frame flow, system construction, and input startup helpers to TypeScript.
    - [x] Convert HUD/lobby HUD and name-editor flow helpers to TypeScript.
    - [x] Convert gameplay input, key-event routing, touch-control flow, and client networking helpers to TypeScript.
    - [x] Convert hit detection and round-ending/reset flow helpers to TypeScript.
    - [x] Convert round ritual, lobby entry, and collision environment/debug helpers to TypeScript.
    - [x] Convert HUD screen wrappers to TypeScript.
    - [x] Convert small drawing/PWA utility wrappers to TypeScript.
    - [x] Convert keyboard/name/score/round-intro state helpers to TypeScript.
    - [x] Convert camera, sound, and touch-control browser wrappers to TypeScript.
    - [x] Convert collision/environment helper modules to TypeScript.
    - [x] Convert projectile/player constructors and browser game startup to TypeScript.
    - Start with pure decision modules and view-model helpers.
    - Then convert networking, screens, input, and HUD modules.
    - Convert gameplay simulation files after shared contracts and client imports are stable.

### P1.4.9 - Retire Client Bootstrap Debt

- [x] Convert `client/src/main.js` to TypeScript.
    - Rename the browser entrypoint to `client/src/main.ts`.
    - Keep the Vite HTML entrypoint pointed at the typed module source.

- [x] Type the client dependency bag passed into `createGame`.
    - Add a named `ClientGameDependencies` contract.
    - Keep dependency value shapes broad while old factory-style modules are narrowed incrementally.

- [x] Remove `// @ts-nocheck` from `client/src/modules/game.ts` incrementally.
    - Add explicit bootstrap state and callback parameter types.
    - Leave deeper runtime object typing for later architecture-health work.

- [x] Keep dependency injection where tests need it, but make runtime construction easier to read.
    - Build the dependency bag in one typed place in `main.ts`.
    - Preserve injected `document`, `window`, and `Image` browser dependencies.

- [x] Decide whether Socket.IO should remain loaded by script injection or become an explicit client entry boundary.
    - Keep Socket.IO loaded through the existing explicit bootstrap script boundary for now.

### P1.4.10 - Define The UI Ownership Boundary

- [x] Document that canvas gameplay remains outside the component framework.
    - Keep the boundary in `documentation/UI-ownership.md`.

- [x] Make the DOM HUD/lobby/high-score/name-editor overlay the component-owned area.
    - Include the mobile virtual joystick, aim slider, fire button, and touch lobby buttons in the eventual component-owned DOM surface.
    - Treat touch controls as a later migration after the safer overlay screens prove the boundary.

- [x] Keep view-model modules framework-independent.
    - Keep Preact or any later renderer out of view-model helpers.

- [x] Components receive render props and emit actions; they should not own game state.
    - Keep persistent state, network state, round state, and name editor value state in existing client modules.

- [x] Keep screen-state transitions in `ClientScreens`, not inside components.
    - Flow modules continue to choose when rendering happens and when side effects run.

### P1.4.10.5 - Shrink The Client Bootstrap Dependency Bag

- [x] Treat the current `createGame` dependency bag as a migration scaffold, not the final shape.
    - Keep it useful while tests still need broad injection.
    - Avoid adding new one-off module dependencies directly to the top-level bag when a grouped factory would fit better.

- [x] Group runtime construction behind focused factories.
    - Add or strengthen factories such as `createClientSystems`, `createClientUi`, `createClientNetwork`, and `createGameRuntime` only where they reduce real bootstrap noise.
    - Keep the factories close to existing module boundaries.
    - Preserve test seams at the flow/module level.

- [x] Narrow `createGame` toward a small set of dependencies.
    - Prefer browser dependencies plus a few grouped factories over dozens of individual module constructors.
    - Keep `document`, `window`, and `Image` injectable for browser startup tests.
    - Let full-app wiring be covered by browser smoke and later end-to-end tests.

### P1.4.11 - Choose And Spike A Component Renderer

- [x] Compare vanilla DOM modules, Preact, Lit, and Svelte/Solid against this project.
- [x] Prefer Preact unless the spike shows it adds more complexity than it removes.
- [x] Add the smallest possible Preact island behind the existing HUD overlay.
- [x] Migrate one low-risk screen first, likely high scores.
- [x] Verify build, browser smoke test, service worker behavior, and mobile layout.

### P1.4.12 - Migrate UI Screens To Components Incrementally

- [x] Convert high scores screen first.
- [ ] Convert lobby screen after high scores.
- [ ] Convert name editor after lobby.
- [ ] Convert game HUD last because it is closest to active gameplay.
- [ ] Remove old imperative DOM screen modules only after their replacement is covered by tests.
- [ ] Convert touch controls after the screen/HUD component boundary is stable.
    - Keep joystick, aim, and fire input state in the existing input/touch flow modules.

### P1.4.12.5 - Tighten The Canvas Gameplay Core

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

### P1.4.13 - Prepare Future Tooling UI

- [ ] Decide whether P3.5 rock/scenario editors should use the same component setup.
- [ ] Create reusable UI primitives only when the second screen needs them.
- [ ] Keep editor state separate from live gameplay state.

### P1.5 - Keep The Architecture Healthy

- [ ] Improve shared configuration.
    - Keep gameplay constants in one place.
    - Separate visual tuning, rules, controls, and network timing.
    - Document constants that affect fairness or UX.

- [ ] Add technical debt notes near risky code.
    - Keep comments short and specific.
    - Prefer TODO entries for larger refactors.
    - Remove stale plans once work is complete.

## P2

- Show main lobby screen for 30 secs and high score screen for 7 secs -> update documentation/Specification-main.md
- Do not show game ID in the main-lobby. Remove line -> update documentation/Specification-main.md
- Do not show characters in the background on the high-scores-page. -> update documentation/Specification-main.md
-

## P3.5 - Content Authoring Tools

- [ ] Add a rock editor page.
    - Provide a WYSIWYG preview for rock dimensions and polygon shape.
    - Accept rock JSON as input.
    - Output rock JSON for copying into project data.
    - Validate JSON and geometry with readable errors.

- [ ] Add a scenario editor page.
    - Provide a WYSIWYG preview of the full arena scenario.
    - Let the user place and adjust rocks, cacti, wagons, saloons, decorations, and player start positions.
    - Accept scenario JSON as input.
    - Output scenario JSON for copying into project data.
    - Validate JSON and scenario geometry with readable errors.

## P4 - Testing And Quality

- [ ] Add lobby/session unit tests.
    - Pairing two players.
    - Third player starts or joins another game.
    - Name sanitizing and duplicate suffixes.
    - Leave before ready.
    - Leave during play.
    - Empty game cleanup.

- [ ] Add gameplay regression tests where practical.
    - Timer behavior.
    - Ammo decrement and reload.
    - Score after hit.
    - Game over winner and tie handling.
    - Stale round events ignored.

- [ ] Add browser smoke tests.
    - Lobby loads.
    - Name editor opens and submits.
    - Two browser clients can ready up.
    - Round reaches `GET READY`, `DRAW !`, and playing state.
    - Mobile/touch mode shows the correct controls.

- [ ] Add Playwright end-to-end tests.
    - Start the local server before tests.
    - Open two browser pages and verify they join the same game.
    - Verify a third browser page is placed in a different game.
    - Press Play on both clients and assert the round reaches `GET READY`, `DRAW !`, and active gameplay.
    - Test name editing with keyboard input.
    - Test name editing with touch/click input.
    - Test opponent disconnect behavior.
    - Capture screenshots for lobby, name editor, game start, mobile lobby, and mobile gameplay.

- [ ] Add Playwright mobile checks.
    - Run with iPhone and Android viewport/device presets.
    - Verify keyboard instructions are hidden on touch.
    - Verify touch lobby buttons are visible.
    - Verify joystick, aim, and fire controls are visible only during gameplay.
    - Verify centered messages remain centered in mobile layout.

- [ ] Add Playwright visual regression snapshots where stable.
    - Keep snapshots focused on HUD and overlay layout.
    - Avoid fragile full-canvas snapshots for animated gameplay unless the scene is frozen.
    - Use screenshots to catch text overlap and mobile layout regressions.

- [ ] Add manual QA checklist.
    - Desktop Chrome/Safari/Firefox.
    - iPhone Safari installed PWA.
    - Android Chrome installed PWA.
    - Slow network.
    - Opponent disconnects before and during a match.

## P6 - Launch Readiness

- [ ] Make the README match the finished product.
    - Explain local run.
    - Explain public deployment.
    - Link to specification and TODO.

- [ ] Review service worker behavior.
    - Cache the correct files.
    - Avoid serving stale JavaScript after deploy.
    - Make offline behavior intentional.

- [ ] Add production health checks.
    - Simple server health endpoint.
    - Basic logging for connections, games, disconnects, and errors.
    - Avoid logging personal or noisy browser data.

- [ ] Check accessibility basics.
    - Buttons have useful labels.
    - Text contrast is readable.
    - Focus does not get trapped.
    - Touch controls are not keyboard-only.

- [ ] Check performance.
    - Stable frame rate during active play.
    - No obvious memory leaks after repeated matches.
    - No excessive Socket.IO traffic.

## Later Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
