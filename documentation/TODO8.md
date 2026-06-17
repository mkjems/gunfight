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

- [ ] Introduce the concept of straightness to the bullet. A value between 0.0 and 1.0
- [ ] How much straightness there is in a bullet depends on the player that shoots, The two players can shoot differently.
- [ ] The straightness shooting of a player should be able to evolve during the game.
- [ ] Once a bullet is fired the straightness of that bullet stays the same.
- [ ] With straightness 1 the bullet flies, like it does today, constant speed straight line.
      With low straightness, the bullet just bounces a long the 'ground' a couple of times and roles to a halt and stays there.
      The idea is that we can add this cartoon like behavior in various amounts, ranging from totally straight to very slow bouncy rolling stopping bullet
      On top of that the challenge is that we have this strange 2D isometric perspective to the whole game, so the fake bounce is always just straight up and down.
- [ ] Give the bullet the concept of height
- [ ] Player should still be able to shoot the bullet in different directions
- [ ] Bullet should bounce like a ball on the 'ground', when height hits zero
- [ ] Bullet should still ricochet on collision with rocks and edge of screen.
- [ ] Bullet should slow down faster, with lower straightness.
- [ ] Bullet should eventually role to a stop on the ground and stay there for the rest of the round if it runs out of velocity.

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
