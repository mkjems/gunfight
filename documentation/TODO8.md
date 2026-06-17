# Gunfight TODO8

## P10.7 - Experiment with ESLint rules

- [x] Add architecture-boundary rules incrementally.
    - [x] `shared/**` must not import client or server modules.
    - [x] client modules must not import server modules.
    - [x] View models must not import side-effectful client layers or use DOM,
          socket, timer, canvas, runtime, or platform side effects.
    - [x] State modules must not import side-effectful client layers or UI code;
          DOM, socket, canvas, runtime, and platform side effects are
          restricted. Timer globals are allowed only in `clientTimers.ts`.
- [ ] Add candidate TypeScript escape-hatch rules.
    - [ ] Reject `any`, TypeScript suppression comments, and non-null
          assertions unless a specific exception is documented.
    - [ ] Prefer explicit type-only imports where they improve readability.
- [ ] Trial type-aware TypeScript ESLint rules separately from normal lint.
    - [x] Do not enable promise and async safety rules now; the first useful
          findings were in lower-priority tool/install code, and the type-aware
          lint cost is not worth it yet.
    - [ ] Consider switch exhaustiveness only where it fits the project's
          const-map state style.
    - [ ] Keep type-aware rules only if the added lint time and findings are
          worthwhile.
- [ ] Trial human-readability smell rules as warnings first.
    - [x] Add `npm run lint:complexity` as a warning-only review pass.
    - [x] Add `npm run lint:shape` as a warning-only file/function size review
          pass.
    - [x] Exclude `client/src/tools/**` from complexity warnings; tools should
          work correctly but do not need polished application architecture.
    - [x] Exclude `client/src/tools/**`, `server/test/**`, and `browser-smoke/**`
          from shape warnings.
    - [ ] Review complexity, shape, nesting depth, and parameter-count warnings
          by reading the affected code, not by blindly satisfying numbers.
    - [ ] Consider restricted syntax for focused tests and TypeScript enums if
          those patterns become real risks.
- [ ] Decide which rules to keep.
    - [ ] Keep rules that catch real unwanted patterns with low noise.
    - [ ] Drop rules that mostly create churn, style fights, or less readable
          code.
    - [ ] Document kept rules and rejected rules in the code quality scorecard.

## P12 Improve visual impact of game

- [ ] Add a an option for a rain effect on the scenario. It should just look like it is raining. I would like to see raindrops falling at an 7 degrees angle and hitting the ground. We cant do collision detection for all drops so we must cheat.

## P14 - Improve Scenario editor

## P16 - Improve current mega components by breaking them into smaller reusable parts and follow component guidelines.

- [ ] Use `Preact-components.md` as the component design guide for this work.
    - [ ] Prefer smaller arrow-function components when touching existing
          component files.
    - [ ] Keep screen/domain components allowed, but compose them from focused
          child components.
    - [ ] Keep gameplay state, network state, timers, socket work, and canvas
          work outside the component tree.
    - [ ] Do not create primitive/shared UI components until at least two real
          product components need the same concept.
- [ ] Split `ClientApp` into clearer app-shell components.
    - [ ] Extract prompt components: rotate prompt and install prompt.
    - [ ] Extract screen wrapper components for game, lobby, high scores, and
          name editor.
    - [ ] Extract touch control wrapper components for lobby and gameplay touch
          controls.
    - [ ] Keep `ClientApp` responsible for composing app state into the visible
          screen tree, not for detailed markup.
- [ ] Split `GameHudComponent` into focused HUD pieces.
    - [ ] Keep `ScoreRow`, `ScoreSide`, `AmmoRow`, `AmmoDisplay`,
          `RoundMessage`, and `HitMessage` as clear individual components.
    - [ ] Keep ids stable for tests and browser/runtime lookup.
    - [ ] Keep score/ammo formatting logic small and local unless another
          component needs it.
- [ ] Split `LobbyMain` into focused lobby pieces.
    - [ ] Extract lobby title/instructions, prompt stack, individual prompt
          slots, previous result, and player labels.
    - [ ] Keep lobby layout data flowing in through props from view models.
    - [ ] Keep visual state such as reserved hidden prompts explicit and easy to
          read.
- [ ] Split `NameEditorComponent` into focused editor pieces.
    - [ ] Extract name value, key grid, key row, key button, and help lines.
    - [ ] Keep direct key selection callback behavior covered by Vitest.
    - [ ] Keep keyboard/name editing state outside the component.
- [ ] Split `HighScoresScreen` into focused score-table pieces.
    - [ ] Extract table, row, cell, and prompt components.
    - [ ] Keep row-limit behavior and empty-row formatting covered by Vitest.
- [ ] Review shared UI opportunities after the first splits.
    - [ ] Consider shared `ArcadeButton`, `ScreenTitle`, `PromptText`, or
          `Stack` components only if the extracted components reveal real
          duplication.
    - [ ] Avoid generic abstractions that make the arcade UI harder to read.
- [ ] Verify each component split incrementally.
    - [ ] Run `npm run test:ui` after each component-area split.
    - [ ] Run `npm run check:deploy` after each completed area.
    - [ ] Run browser smoke tests after changes that affect layout, touch
          controls, or screen visibility.

## P17 - Change the bullet trajectory behavior to a more cartoon style

Idea: What if the players guns were not very good or dangerous in the beginning of the game. And they had to unlock better shooting by solving some challenge first. This could give the game a story and direction.

- [x] Introduce bullet `straightness` as a value from `0.0` to `1.0`.
- [x] Store shooting straightness on the player, not only on the bullet.
      The two players can have different shooting straightness.
- [ ] Let a player's shooting straightness evolve during the game.
- [ ] Replace the current hardcoded shooting straightness with story or
      progression state when that design is ready.
- [ ] Tune the hardcoded shooting straightness after playtesting the first
      cartoon-trajectory slice.
- [x] Freeze `straightness` on each bullet when it is fired.
- [x] Keep `straightness: 1.0` as the current behavior: constant-speed,
      straight-line flight, current collision behavior, and current ricochet
      behavior.
- [x] Use `altitude` for the cartoon vertical arc. Do not call it `height`,
      because bullet `height` already means sprite/collision-box height.
- [x] Keep `x` and `y` as the bullet's ground-plane path. Draw the bullet at
      `y - altitude`, with any shadow or ground contact effect drawn at `x,y`.
- [x] Player aim should still control the ground-plane firing direction.
- [x] Low-straightness bullets should bounce along the ground, lose speed,
      roll, then stop and stay visible for the rest of the round.
- [x] Ground bounces affect only `altitude` and vertical bounce velocity.
      Ricochets against rocks and screen edges affect only the ground-plane
      `x,y` movement.
- [x] Bullets should slow down faster when straightness is lower.
- [x] Define a `minimumHarmStraightness` cutoff. Bullets below that straightness
      are theatrical only and can never hurt the opponent.
- [x] Above `minimumHarmStraightness`, a low-straightness bullet can hurt a
      player only while it is still moving faster than a harm velocity cutoff.
- [x] Bullets that are rolling too slowly or lying on the ground are harmless.
- [x] When an un-straight bullet stops, it becomes resting scenery for the
      current round and no longer blocks that player from firing another
      bullet.
- [x] Include straightness, altitude, velocity, and resting/harmful state in the
      shot snapshot so both clients simulate the same fired bullet.
- [x] Keep a newly fired bullet at its frozen muzzle position for its first
      scene move so local and remote shots show the same visible travel range.
- [x] Refresh the current hardcoded shooting straightness onto existing players
      during sync/reset so tuning changes cannot leave one side stale.

## P18 - Use straightness shooting as part of the game story

Goal: Lets get some ideas on the table for a more interesting game game story
Lets have a brainstorm and throw some ideas on the table.

- [ ] Idea: Where the bullet lands, there will grow a cactus.
- [ ] Ways to increase straightness: Food,
- [ ] Ways to decrease straightness: Alcohol,

## Other Ideas

- [ ] Add more interactive elements to the scenarios,
      [ ] Barrels you shoot and liquid spills out
      [ ] TNT you can shoot that explodes
      [ ] Better gun you can pick up
      [ ] A force shield that will protect you from bullet in a number of seconds
- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
