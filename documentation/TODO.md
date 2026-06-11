# Gunfight TODO



## P2 

- Show main lobby screen for 30 secs and high score screen for 7 secs -> update documentation/Specification-main.md
- Do not show game ID in the main-lobby. Remove line -> update documentation/Specification-main.md
- Do not show characters in the background on the high-scores-page. -> update documentation/Specification-main.md
-


## P3 - Code Architecture

- [ ] Add code formatting and linting.
  - Pick one formatter.
  - Add lint rules that catch accidental globals and unsafe equality.
  - Run checks in CI before deploy.

- [ ] Split the large client game module into clearer systems.
  - Keep `index.js` as orchestration only.
  - Move lobby UI, game HUD, round flow, sound, networking, and input into focused modules.
  - Keep rendering, simulation, and network synchronization easy to reason about separately.

- [ ] Create an explicit client state model.
  - Define states such as lobby, name editing, round intro, playing, hit pause, game over, and abandoned.
  - Make legal state transitions visible in one place.
  - Avoid scattered checks against string state values.

- [ ] Introduce typed data contracts.
  - Document or type Socket.IO payloads.
  - Define client, game model, scenario, obstacle, player, bullet, and score shapes.
  - Validate incoming server and client payloads at runtime where needed.

- [ ] Decide on TypeScript.
  - Start with `checkJs` and JSDoc if a low-risk migration is preferred.
  - Move shared model and networking files first if adopting TypeScript.
  - Avoid converting everything at once.

- [ ] Decide on a build tool.
  - Consider Vite for module bundling, dev server, cache-busted builds, and TypeScript support.
  - Keep the current static-file setup until bundling solves a real pain.
  - Make sure service worker caching and deployment still stay simple.

- [ ] Decide on UI component strategy.
  - Keep canvas gameplay outside any component framework.
  - Consider small DOM-rendering helpers or lightweight components for lobby, HUD, name editor, install prompt, and high scores.
  - Avoid a full React migration unless UI complexity grows beyond the current arcade overlay.

- [ ] Reduce global namespace coupling.
  - Replace broad `GF.*` mutation with imports when a build step exists.
  - Keep module boundaries explicit.
  - Make dependencies injectable for tests where practical.

- [ ] Improve shared configuration.
  - Keep gameplay constants in one place.
  - Separate visual tuning, rules, controls, and network timing.
  - Document constants that affect fairness or UX.

- [ ] Add technical debt notes near risky code.
  - Keep comments short and specific.
  - Prefer TODO entries for larger refactors.
  - Remove stale plans once work is complete.

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
