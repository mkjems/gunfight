# Gunfight TODO

Roadmap for making the game match `Specification-main.md` and feel like a polished public arcade game.

## P0 - Spec Compliance

- [x] Add the High scores screen.
  - Show player name, wins, kills, and deaths.
  - Keep scores in server memory.
  - Clear scores naturally when the server restarts.
  - There is no direct way to open the High score screen from the lobby.
    While no user has pressed Ready, the lobby alternates every 7 seconds between the High score screen and the main lobby. `PRESS P TO PLAY` still flashes on desktop, and the Play button still appears on mobile.

- [x] Persist the player name in the browser.
  - Save the submitted name to `localStorage` or `sessionStorage`.
  - Send the saved name when joining the lobby.
  - Keep server-side sanitizing and duplicate-name suffixes.

- [x] Verify `GET READY` and `DRAW !` are centered.
  - Center both messages on desktop.
  - Center both messages on mobile camera view.
  - Messages can overlap whatever is in the center.

- [x] Confirm all lobby states match the specification.
  - `LOOKING FOR CHALLENGER`
  - `WAITING`
  - `READY`
  - `OPPONENT LEFT`
  - Ensure each state appears in the correct player slot.
  - Hide `PRESS E TO EDIT NAME` after the local player presses `P`.
  - Ignore `E` while the local player is `READY`; allow editing again only after returning to `WAITING`.

- [ ] Complete abandoned-game recovery.
  - When an opponent leaves mid-game, show `OPPONENT LEFT`.
  - Return the remaining player to a useful lobby state.
  - Decide whether recovery is automatic requeue or a visible Play/Requeue action.

- [ ] Confirm shooting is impossible in the lobby.
  - Desktop movement and aim may work.
  - Space must not fire bullets before gameplay.
  - Touch fire control must stay hidden before gameplay.

- [ ] Confirm reload rules.
  - Reload both players after every kill.
  - Reload both players if both run out of bullets.
  - Keep ammo HUD in sync after reloads.

- [ ] Confirm match timing.
  - Match timer starts only when the duel begins.
  - Match ends at 70 seconds.
  - Winner is the player with the highest score when time expires.
  - Handle ties intentionally.

## P1 - Core User Experience

- [ ] Make first visit feel instant and obvious.
  - Lobby should explain status with very little text.
  - Primary action should be obvious on keyboard and touch.
  - Avoid showing instructions that do not apply to the current device.

- [ ] Polish the name editor.
  - Use `DEL`, `RND`, and `OK` consistently.
  - Make the selected key unmistakable.
  - Prevent layout shift when moving selection.
  - Make touch targets comfortable on phones.
  - Submit and close behavior should feel immediate.

- [ ] Improve game-over feedback.
  - Show final score clearly.
  - Show winner or tie state.
  - Return to lobby after a readable delay.
  - Reset ready state cleanly before the next match.

- [ ] Improve hit feedback.
  - Keep hit pause short and satisfying.
  - Show hit message near the correct player or in a consistent arcade position.
  - Ensure death animation, sound, score, and reload happen together.

- [ ] Tune mobile camera.
  - Follow the local player smoothly.
  - Clamp to arena bounds.
  - Keep bullets and opponent readable.
  - Avoid motion that feels jumpy during quick direction changes.

- [ ] Tune mobile controls.
  - Joystick, aim, and fire must work without accidental page scrolling.
  - Controls must respect safe areas.
  - Fire button must feel responsive.
  - Aim control should be precise enough for short duels.

- [ ] Improve install/PWA messaging.
  - Show install hint only when useful.
  - Hide lobby prompts while install message is visible.
  - Make dismiss behavior persistent for the session.
  - Verify home-screen launch on iPhone and Android.

## P2 - Multiplayer Robustness

- [ ] Harden room isolation.
  - A third player must never affect an active two-player game.
  - Input, position, damage, ready, and round events must stay inside their room.
  - Add tests for two simultaneous games.

- [ ] Add server validation for gameplay events.
  - Ignore events from sockets without a game.
  - Ignore gameplay events from non-playing games where appropriate.
  - Validate payload shape for key events, positions, obstacle damage, and round advancement.

- [ ] Make round advancement harder to desync.
  - Ensure only the expected client advances after a hit.
  - Ignore stale `advanceRound` and obstacle events from older rounds.
  - Recover cleanly if one browser misses an event.

- [ ] Improve disconnect handling.
  - Disconnect before ready should free the slot.
  - Disconnect during play should abandon the game.
  - Empty games should be removed.
  - Reconnect behavior should be predictable.

- [ ] Add latency tolerance.
  - Keep local input immediate.
  - Smooth remote position updates.
  - Avoid bullets or hit messages appearing from stale state.
  - Test with two browsers and throttled network conditions.

## P3 - Visual And Audio Polish

- [ ] Audit all text for arcade tone.
  - Keep labels short.
  - Use consistent capitalization.
  - Avoid modern web-app wording inside the game.

- [ ] Polish HUD layout.
  - Score, timer, ammo, round messages, and hit messages should have stable positions.
  - Put player names on the bottom line next to the ammo graphics.
  - Place each name on the inside of its ammo display, facing toward the centerline.
  - Keep left and right name placement symmetrical.
  - Nothing should overlap on desktop or mobile.
  - Text should remain readable over all scenarios.

- [ ] Improve sprite and obstacle presentation.
  - Confirm all assets render crisp with image smoothing disabled.
  - Tune cactus, wagon, rock, and saloon placement per scenario.
  - Make damage feedback readable but not noisy.

- [ ] Tune sound.
  - Balance volume across gunshot, empty gun, pain, ready, ricochet, and obstacle hits.
  - Avoid repeated sounds stacking unpleasantly.
  - Confirm audio starts reliably after first user interaction.

- [ ] Add more scenario variety.
  - Keep layouts fair for both players.
  - Avoid spawn positions that create instant unavoidable hits.
  - Use obstacles to create interesting ricochet and movement choices.

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

## P5 - Code Architecture

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

- [ ] Add code formatting and linting.
  - Pick one formatter.
  - Add lint rules that catch accidental globals and unsafe equality.
  - Run checks in CI before deploy.

- [ ] Add technical debt notes near risky code.
  - Keep comments short and specific.
  - Prefer TODO entries for larger refactors.
  - Remove stale plans once work is complete.

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
