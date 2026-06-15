# Gunfight TODO4

## P5 Content Authoring Tools

Goal statement:

When P5 is complete, creating arena content should be a visual workflow instead
of a code-editing workflow. The designer should be able to open browser-based
tools, import existing JSON, adjust rocks and full scenarios directly in a
WYSIWYG preview, see validation errors in plain language, and export clean JSON
that can be copied back into the project data files. The rock editor should make
small reusable rock definitions easy to shape and test. The scenario editor
should compose those rocks with cacti, wagons, saloons, decorations, and player
start positions inside the full arena, so a complete playable scene can be
iterated on visually before it becomes game data.

### P5.1 Add a rock editor page.

- [x] Add a rock editor page.
    - [x] Provide a WYSIWYG preview for rock dimensions and polygon shape.
    - [x] Accept rock JSON as input.
    - [x] Output rock JSON for copying into project data.
    - [x] Validate JSON and geometry with readable errors.

### P5.5 Add a scenario editor page.

- [x] Add a scenario editor page.
    - [x] Provide a WYSIWYG preview of the full arena scenario.
    - [x] Let the user place and adjust rocks, cacti, wagons, saloons, decorations, and player start positions.
    - [x] Accept scenario JSON as input.
    - [x] Output scenario JSON for copying into project data.
    - [x] Validate JSON and scenario geometry with readable errors.

## P6 Improve visual effects

### P6.1 Add particle layer for more special effects

- [x] Add a separate canvas particle layer.
    - [x] Do not add a particle library for the first version. Use a small local
          particle system so effects stay pixel-art, deterministic enough to
          test, and consistent with the existing imperative canvas engine.
    - [x] Add a `particleCanvas` element as a sibling of `canvas` and
          `hudCanvas` in `client/index.html`.
    - [x] Style `particleCanvas` like the other game canvases: same size,
          pixelated rendering, absolute positioning, pointer events disabled,
          and a z-index above the game world but below DOM HUD text and touch
          controls.
    - [x] Extend `ClientCanvasSetup` so it sizes `particleCanvas`, disables
          image smoothing on its context, and returns the canvas/context with
          the existing surfaces.
    - [x] Extend canvas visibility flow so `particleCanvas` is shown and hidden
          with the gameplay canvas and cleared when returning to waiting/lobby
          screens.

- [x] Add a focused `ParticleLayer` engine module.
    - [x] Use the visual language of pixels flying around: the game world is
          made from tiny pixel blocks, and impacts toss those blocks loose.
    - [x] Keep particles as plain data objects with position, velocity,
          lifetime, age, size, color, and optional gravity/friction.
    - [x] Cap total particles with a small fixed limit or reusable pool so
          effects cannot cause frame spikes.
    - [x] Provide a small API for experiments:
          `spawnMuzzleFlash`, `spawnGunSmoke`, `spawnRicochetSparks`,
          `spawnRockChips`, `spawnObstacleHit`, and `spawnPlayerHit`.
    - [x] Keep the drawing style primitive and arcade-like: small hard-edged
          rectangles or single pixels that read as tiny building blocks, no
          blur, no gradients, no alpha-heavy modern effects.
    - [x] Add `update(deltaSeconds)`, `render(context)`, `clear()`, and
          `count()` methods so behavior is easy to unit test.

- [x] Wire the particle layer into the frame flow.
    - [x] Construct `ParticleLayer` in the runtime systems setup.
    - [x] Update particles once per frame from `ClientFrameFlow.update`.
    - [x] Clear and render `particleCanvas` once per frame from
          `ClientFrameFlow.render`.
    - [x] Apply the same camera transform to `particleCanvas` during gameplay
          so world-positioned particles follow the mobile camera exactly like
          players, bullets, and obstacles.
    - [x] Render particles after scenario/player/bullet drawing, but before DOM
          HUD text and touch controls.

- [x] Add the first effect triggers.
    - [x] On local and remote bullet creation, spawn a tiny muzzle flash and a
          short burst of hot pixels at the bullet muzzle.
    - [x] On ricochet, spawn two or three sparks at the bounce point.
    - [x] On rock collision, spawn a few yellow/black pixel chips from the rock
          surface.
    - [x] On cactus and wagon damage, spawn a small burst of object-colored
          pixel blocks.
    - [x] On player hit, spawn a brief impact burst while preserving the
          existing pain sound and death animation timing.

- [x] Add guardrail tests and docs.
    - [x] Unit test particle update, expiry, pool/cap behavior, and clear.
    - [x] Update frame-flow tests so particle update/render order is explicit.
    - [x] Update canvas-setup and HUD-flow tests for the new canvas surface.
    - [x] Add a browser smoke assertion that the particle canvas exists, is
          stacked correctly, and does not intercept pointer input.
    - [x] Update `Specification-main.md` and `UI-ownership.md` once the layer is
          implemented.