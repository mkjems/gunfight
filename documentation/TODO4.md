# Gunfight TODO4

## State Model improvements

### P3.3 - State model review and future plans

- [ ] State model review
    - [ ] We should look into the current state model a come up with an improvement.
    - [ ] We should look into if disconnect and re-connect are handled correct from mobile and desktop.
    - [ ] How do we pair up players who have lost they opponent? Do we use alone players? or wait for their old opponents to reconnect.

- [x] No ready state without opponent
    - [x] Should you be able to be in ready state when you have no opponent? No. `READY` requires a connected opponent.
    - [x] If a player loses their opponent because of disconnect or reload, the remaining player loses `READY` state and returns to waiting for an opponent.

- [x] Auto pair alone players
    - [x] When two players are alone in separate waiting games, automatically pair them into one game.
    - [x] When pairing previously alone players, clear ready state for both players.
    - [x] Do not pair players out of `playing` games; only pair `waiting` single-player games.
    - [x] Update docs

## P5 Content Authoring Tools

### P5.1 Add a rock editor page.

- [ ] Add a rock editor page.
    - [ ] Provide a WYSIWYG preview for rock dimensions and polygon shape.
    - [ ] Accept rock JSON as input.
    - [ ] Output rock JSON for copying into project data.
    - [ ] Validate JSON and geometry with readable errors.

### P5.5 Add a scenario editor page.

- [ ] Add a scenario editor page.
    - [ ] Provide a WYSIWYG preview of the full arena scenario.
    - [ ] Let the user place and adjust rocks, cacti, wagons, saloons, decorations, and player start positions.
    - [ ] Accept scenario JSON as input.
    - [ ] Output scenario JSON for copying into project data.
    - [ ] Validate JSON and scenario geometry with readable errors.

## P6 Improve visual effects

### P6.1 Add particle layer for more special effects

- [ ] Add a separate canvas particle layer.
    - [ ] Do not add a particle library for the first version. Use a small local
          particle system so effects stay pixel-art, deterministic enough to
          test, and consistent with the existing imperative canvas engine.
    - [ ] Add a `particleCanvas` element as a sibling of `canvas` and
          `hudCanvas` in `client/index.html`.
    - [ ] Style `particleCanvas` like the other game canvases: same size,
          pixelated rendering, absolute positioning, pointer events disabled,
          and a z-index above the game world but below DOM HUD text and touch
          controls.
    - [ ] Extend `ClientCanvasSetup` so it sizes `particleCanvas`, disables
          image smoothing on its context, and returns the canvas/context with
          the existing surfaces.
    - [ ] Extend canvas visibility flow so `particleCanvas` is shown and hidden
          with the gameplay canvas and cleared when returning to waiting/lobby
          screens.

- [ ] Add a focused `ParticleLayer` engine module.
    - [ ] Use the visual language of pixels flying around: the game world is
          made from tiny pixel blocks, and impacts toss those blocks loose.
    - [ ] Keep particles as plain data objects with position, velocity,
          lifetime, age, size, color, and optional gravity/friction.
    - [ ] Cap total particles with a small fixed limit or reusable pool so
          effects cannot cause frame spikes.
    - [ ] Provide a small API for experiments:
          `spawnMuzzleFlash`, `spawnGunSmoke`, `spawnRicochetSparks`,
          `spawnRockChips`, `spawnObstacleHit`, and `spawnPlayerHit`.
    - [ ] Keep the drawing style primitive and arcade-like: small hard-edged
          rectangles or single pixels that read as tiny building blocks, no
          blur, no gradients, no alpha-heavy modern effects.
    - [ ] Add `update(deltaSeconds)`, `render(context)`, `clear()`, and
          `count()` methods so behavior is easy to unit test.

- [ ] Wire the particle layer into the frame flow.
    - [ ] Construct `ParticleLayer` in the runtime systems setup.
    - [ ] Update particles once per frame from `ClientFrameFlow.update`.
    - [ ] Clear and render `particleCanvas` once per frame from
          `ClientFrameFlow.render`.
    - [ ] Apply the same camera transform to `particleCanvas` during gameplay
          so world-positioned particles follow the mobile camera exactly like
          players, bullets, and obstacles.
    - [ ] Render particles after scenario/player/bullet drawing, but before DOM
          HUD text and touch controls.

- [ ] Add the first effect triggers.
    - [ ] On local and remote bullet creation, spawn a tiny muzzle flash and a
          short burst of hot pixels at the bullet muzzle.
    - [ ] On ricochet, spawn two or three sparks at the bounce point.
    - [ ] On rock collision, spawn a few yellow/black pixel chips from the rock
          surface.
    - [ ] On cactus and wagon damage, spawn a small burst of object-colored
          pixel blocks.
    - [ ] On player hit, spawn a brief impact burst while preserving the
          existing pain sound and death animation timing.

- [ ] Add guardrail tests and docs.
    - [ ] Unit test particle update, expiry, pool/cap behavior, and clear.
    - [ ] Update frame-flow tests so particle update/render order is explicit.
    - [ ] Update canvas-setup and HUD-flow tests for the new canvas surface.
    - [ ] Add a browser smoke assertion that the particle canvas exists, is
          stacked correctly, and does not intercept pointer input.
    - [ ] Update `Specification-main.md` and `UI-ownership.md` once the layer is
          implemented.

## Other Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
- [ ] Add the number of wins/kills after the name in the lobby: LUKE 5/10

## MAYBE bad Ideas

- [ ] After the game. Players should see the high score page for a period of time, before returning to main lobby.
- [ ] When both players have marked themselves as ready - I would like a leave-lobby-for-game-sequence. I would like the lobby screen to keep the players in the lobby for a few seconds so you can see the READY status in negative text for 2 seconds and hear the ready sound before switching to the game screen.
- [ ] We should collect all game constants like this leave-lobby-pause-duration above in some central shared place.
- [ ] On Desktop, after a game. 'Game over' should continue to be shown in the main lobby as should the last game result in the top line.
