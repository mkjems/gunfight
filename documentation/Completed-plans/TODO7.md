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

- [x] In lobby screen, add particle burst to gun when it is activated, but fire no bullet. Bursts should be same style as in the game.
- [x] In lobby screen desktop - avoid title and keyboard instructions jump on screen when entering into ready state (possibly because of display none).
- [x] In desktop main lobby, if the current two players have just completed a game together, show a top HUD result line.
    - [x] Reuse the game HUD layout: left side score then current player name, center `GAME OVER`, right side current player name then score.
    - [x] Keep it tied only to the current two-player game session; do not store or show longer-term history.
    - [x] Hide it when either player leaves, disconnects, is paired with a new opponent, or either player enters `READY`.
    - [x] Do not show this result line on mobile.
    - [x] Use current lobby names when rendering the previous result.

## P10.5 - Investigate how Eslint can help improve code quality

- [x] Document what is possible with ESLint.
- [x] Document how agents should work well with ESLint.
- [x] Document how to find rules that preserve human-readable code.
- [x] Tighten the current JavaScript lint baseline and make lint targets
      explicit.

## P10.6 - Add TypeScript ESLint

- [x] Add TypeScript ESLint dependencies and parser/plugin configuration.
- [x] Update lint scripts so JavaScript and TypeScript files are linted.
- [x] Document the responsibility split between ESLint, Prettier, and `tsc`.
- [x] Fix or document any low-noise rule findings from the first TypeScript
      lint run.

## P11 - Mobile lobby screen improvements

- [x] On mobile, in the lobby. Ad some vertical space between the 'Play gunfight' button and the other two buttons. And I would like high-score and edit-name buttons to be horizontally aligned.

## P13 - Improve Rock editor

- [x] Make the rock preview use an absolute world-coordinate scale.
    - [x] Replace the bounds-based preview scale in
          `client/src/tools/rockEditor.ts` with editor zoom state so the view
          transform no longer derives scale from the selected rock dimensions.
    - [x] Keep world origin centered by default and draw the x/y axes from that
          origin; changing rock width, height, or selected type must not recenter
          or rescale the axes.
    - [x] Keep drag hit testing and `screenToWorld` coordinate edits on the same
          absolute transform so dragged points still write real rock coordinates.
- [x] Add preview zoom controls to the rock editor UI.
    - [x] Add `-` and `+` zoom buttons, plus a compact zoom or axis-scale label,
          near the preview toolbar in `client/rock-editor.html`.
    - [x] Store zoom as discrete, clamped levels in `rockEditor.ts`; default to a
          practical world-to-screen scale for the existing rocks.
    - [x] Make zoom redraw only the preview transform and grid; it must not change
          rock JSON, point coordinates, width, height, selected point, or
          validation state.
    - [x] Disable the zoom buttons at min/max zoom or otherwise make the limits
          clear.
- [x] Add preview panning.
    - [x] Show the world origin `(0, 0)` as a low-noise draggable marker on the
          canvas.
    - [x] Dragging the origin marker should pan the viewport by changing the
          preview offset; it must not move the rock or rewrite point
          coordinates.
    - [x] Allow empty-canvas drag panning if it feels natural after the origin
          marker is in place.
    - [x] Add a reset-view control if panning makes it easy to lose the rock or
          origin.
- [x] Draw the grid from world coordinates instead of fixed canvas pixels.
    - [x] Derive grid-line spacing and axis labels from the current zoom level.
    - [x] Keep major axes visually distinct from regular grid lines.
    - [x] Add a subtle size reference such as a scale-bar label or sparse axis
          numbers; keep it quiet enough that polygon editing remains the focus.
    - [x] Keep the canvas usable on desktop and stacked mobile layouts.
- [x] Verify the behavior.
    - [x] Extend the rock-editor browser smoke test to prove canvas rendering
          still works after zooming.
    - [x] Add a browser smoke assertion that applying a larger rock size changes
          the rock's on-canvas size while the axis/grid scale stays stable.
    - [x] Add a browser smoke assertion that panning changes only the preview
          transform, not the output JSON.
    - [x] Run `npm run check:deploy`.
    - [x] Run `npm run test:browser` for the updated `/rock-editor` smoke
          coverage.
- [x] Update docs after implementation.
    - [x] Update `documentation/Specification-main.md` to mention absolute
          preview scale, zoom controls, panning, and the low-noise size
          reference.
    - [x] Mark this P13 checklist done as each implementation task lands.

## P15 - Improve the CSS - start using CSS Modules in the product

- [x] Introduce CSS Modules for product UI components, not as a full CSS rewrite.
    - [x] Keep global CSS for app-wide foundations: font faces, CSS variables,
          reset/body rules, `#gameStage`, canvas layers, shared HUD/touch shell
          rules, and selectors that intentionally coordinate several layers.
    - [x] Start with one small product component as the pilot, preferably a
          Preact-only surface such as touch lobby controls or high scores.
    - [x] Add a `*.module.css` file next to that component and import it from the
          component.
    - [x] Keep ids only where tests, accessibility, or cross-layer lookup depend
          on them; move purely presentational classes into the module.
    - [x] Add or keep TypeScript support for `*.module.css` imports if the
          current build needs a declaration file.
- [x] Migrate product styles incrementally by ownership area.
    - [x] Move touch lobby controls row styling as the first CSS Modules pilot.
    - [x] Move high-scores table and row styling into a CSS Module.
    - [x] Move name editor value, help, grid, row, and key styling into a CSS
          Module.
    - [x] Move score row, ammo display, round message, and hit message styling
          into a CSS Module.
    - [x] Move lobby instructions, prompt slots, player labels, and previous
          result wrapper styling into a CSS Module.
    - [x] Move gameplay touch joystick, aim slider, and fire button styling
          into a CSS Module while keeping imperative ids stable.
    - [x] Move install prompt and rotate prompt styling into a CSS Module while
          keeping app-shell ids stable.
    - [x] Move `ClientApp` screen wrapper and touch-lobby wrapper styling into
          a CSS Module while keeping screen ids stable.
    - [x] Move the first isolated component set while keeping ids stable and
          moving only owned presentation classes.
    - [x] Leave layout styles that coordinate several layers in global CSS until
          their ownership is clearer.
    - [x] For future component migrations, keep running component tests and a
          quick browser check for desktop/mobile layout.
    - [x] Avoid future id or markup changes unless the component migration needs
          them.
- [x] Move component tests that import CSS Modules onto a Vite-aware path.
    - [x] Decide between Vitest for component/UI tests or a shared Vite SSR
          loader used from `node:test`.
    - [x] Prefer Vitest if it can run the Preact component tests with low setup
          cost and without weakening the existing Node test workflow.
    - [x] Keep `node:test` for server/domain tests that do not need Vite asset,
          TSX, or CSS transforms.
    - [x] Replace per-test `stubCssModuleImports` helpers with the Vite-aware
          loader/test runner.
    - [x] Prove the new path on `clientComponentScreens` and `clientHudOverlay`
          before migrating more component styles.
    - [x] Update `package.json` scripts so normal checks run the Vite/Vitest UI
          tests together with the existing Node tests.
    - [x] Document the chosen test boundary in `UI-ownership.md`.
- [x] Decide how CSS Modules relate to tools.
    - [x] Do not migrate `client/src/tools/**` just to match the product.
    - [x] Tools are internal authoring utilities; they should work correctly, but
          they do not need the same CSS architecture polish as the game product.
    - [x] Consider CSS Modules for a tool only when actively changing that tool
          and when local scoping clearly makes the editor code easier to work
          with.
- [x] Document the kept pattern after the first successful migration.
    - [x] Naming convention for module files and imported `styles` objects.
    - [x] What remains global and why.
    - [x] How tests should select elements without depending on hashed class
          names.
