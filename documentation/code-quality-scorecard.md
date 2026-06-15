# Code Quality Scorecard

Last updated: 2026-06-15.

This document is a status report for code quality, maintainability, and
readability. It is not a grade. The goal is to make future changes easier by
keeping the code modular, typed, tested, and aligned with the architecture
documents.

Status labels:

- `Good`: healthy now; preserve this.
- `Watch`: acceptable now; review before growing the area.
- `Needs work`: known problem that should become planned work.

## Current Verification

| Area                  | Status | Current result                                                                  |
| --------------------- | ------ | ------------------------------------------------------------------------------- |
| Full check            | Good   | `npm run check` passes after formatting.                                        |
| Formatting            | Good   | Prettier covers package/config files, scripts, server, shared, client, docs.    |
| Linting               | Good   | ESLint catches accidental globals and unsafe equality in JS/client code.        |
| Type checking         | Good   | Shared and client TypeScript are strict; server JS is checked less strictly.    |
| Node tests            | Good   | 230 Node tests cover core behavior and pure modules.                            |
| Browser smoke tests   | Good   | 10 Playwright smoke tests cover app startup, mobile lobby, and two-client play. |
| Source escape hatches | Good   | No `any`, `@ts-ignore`, `@ts-expect-error`, `TODO`, or `FIXME` in source.       |

The browser smoke tests start a local server. In the Codex sandbox they may need
an escalated run because the server listens on port `18080`.

## Architecture Boundary Status

| Boundary        | Status | Notes                                                                                    |
| --------------- | ------ | ---------------------------------------------------------------------------------------- |
| Server          | Good   | Owns sessions, pairing, names, ready flags, lifecycle phase, scenarios, and high scores. |
| Runtime         | Watch  | `client/src/runtime/game/runtime.ts` is central and large; keep new orchestration thin.  |
| Flows           | Good   | Side effects and sequencing live in flow modules.                                        |
| View models     | Good   | View models are framework-independent and do not use browser, socket, or timer APIs.     |
| Components      | Good   | Components own DOM markup and callbacks, not game state or side effects.                 |
| Canvas engine   | Good   | Simulation and drawing stay outside the component tree.                                  |
| Shared models   | Watch  | `shared/contracts.ts` is useful but large; split content validation if it grows.         |
| Authoring tools | Watch  | Editor UI files are large; keep core editor logic separate from DOM wiring.              |

The boundary rules are defined in `Architecture-flow.md`, `State-ownership.md`,
and `UI-ownership.md`. Keep this scorecard aligned with those documents.

## Large Or Central Modules

These files are not automatically bad, but they deserve care before adding more
responsibility:

- `client/src/tools/scenarioEditor.ts` - 1100 lines. DOM-heavy authoring tool.
- `client/src/runtime/game/runtime.ts` - 1122 lines. Main runtime wiring and
  orchestration.
- `client/src/tools/scenarioEditorCore.ts` - 826 lines. Scenario editor domain
  logic.
- `shared/contracts.ts` - 852 lines. Shared data contracts and runtime guards.
- `client/src/tools/rockEditor.ts` - 622 lines. DOM-heavy authoring tool.
- `client/src/tools/rockEditorCore.ts` - 520 lines. Rock editor domain logic.
- `client/src/engine/scenarioRenderer.ts` - 493 lines. Scenario rendering.
- `client/src/runtime/game/types.ts` - 472 lines. Runtime type surface.
- `client/src/input/touchControls.ts` - 447 lines. Imperative touch pointer
  handling.
- `server/gameModules/lobby.ts` - 503 lines. Server matchmaking rules.
- `server/server.js` - 395 lines. HTTP routes and socket protocol handlers.

When changing one of these files, prefer a small local extraction only if it
clarifies ownership or removes repeated rules.

## Typing Status

`client/src` and `shared` use strict TypeScript. The root `tsconfig.json`
checks server JavaScript with `allowJs` and `checkJs`, but `strict` is false
there. Test files are JavaScript and intentionally lightweight.

Current typing guidance:

- Keep new client and shared code in TypeScript.
- Add explicit payload types at module boundaries.
- Keep runtime guards in `shared/contracts.ts` or a future split from it.
- Avoid `any`; use `unknown` at external boundaries and normalize payloads.
- Convert server JS to TypeScript only as planned work, not incidentally.

## Constants And Configuration

`client/src/platform/config.ts` already owns shared gameplay constants such as
canvas size, match length, ammo, round delays, player movement, sprites,
colliders, and bullet speed.

Keep constants close to their owning module unless they are product rules or
cross-module contracts:

- Product rules belong in `Config` or state modules.
- Screen and round-state names belong in `client/src/state/clientScreens.ts`.
- Server lifecycle phases belong in `shared/contracts.ts`.
- One-off drawing values can stay local to the renderer that uses them.
- Editor-only dimensions can stay in the editor module unless reused by editor
  core logic and editor UI.

Watch item: socket event names are repeated between `server/server.js`,
`client/src/network/clientNetwork.ts`, and client flow/input modules. They are
stable now, but a future protocol change should extract a shared `SocketEvent`
constant map and keep the existing socket behavior covered by tests.

Avoid creating one giant constants file. A constant should move only when it is
shared, defines a product rule, or prevents two modules from silently drifting.

## Test Coverage Map

Current test shape:

- 57 Node test files.
- 3 Playwright browser smoke spec files.
- 230 Node tests passing.
- 10 browser smoke tests passing.

Behavior areas with good coverage:

- Lobby pairing, disconnects, requeue, ready rules, and high scores.
- Shared contract normalization and content validation.
- Round states, round ritual, round reset, round end, timers, ammo, and hit
  handling.
- Client flow modules, model sync, player position sync, obstacle sync, and key
  events.
- Component render props, lobby view model, game HUD view model, and app-root
  rendering.
- Touch controls, mobile lobby behavior, and two-client browser gameplay smoke.
- Rock and scenario editor core validation.

Watch areas:

- Full client-authoritative gameplay divergence remains a known product and
  architecture risk.
- Browser smoke tests cover important happy paths, not every visual state.
- Large authoring tool UI files have core coverage, but DOM interaction paths
  should get focused tests when changed.

## Documentation Alignment

The active specification documents are living documentation. Completed plans in
`documentation/Completed-plans` are historical and should not be treated as
current truth.

Keep these docs in sync when behavior changes:

- `Specification-main.md` for product behavior.
- `Connection-state-model.md` for pairing, ready, disconnect, and reconnect
  behavior.
- `State-ownership.md` for server/client ownership.
- `UI-ownership.md` for canvas, DOM, component, and flow boundaries.
- `Architecture-flow.md` for construction and control flow.
- This scorecard for quality status and maintainability risks.

## Duplication Guidance

Duplication is harmful when it copies a rule, protocol, state transition, or
payload shape. Remove that kind of duplication.

Duplication can be acceptable when it keeps rendering code, tests, or symmetric
UI branches easy to read. Do not force DRY if the abstraction hides the rule
being tested or drawn.

Watch items for future cleanup:

- Shared socket event names.
- Timer-name arrays in flow modules if timer coordination grows.
- Repeated editor preview constants if rock and scenario editor behavior starts
  to share more UI logic.

## Next Quality Work

Good next tasks, in priority order:

1. Extract shared socket event constants when touching the socket protocol.
2. Split `shared/contracts.ts` if content validation and network payload guards
   start to obscure each other.
3. Split authoring tool DOM files only around a real editor change.
4. Revisit server TypeScript conversion when server behavior changes enough to
   justify the migration.
5. Add browser smoke coverage for any new cross-device or visual-state flow.
