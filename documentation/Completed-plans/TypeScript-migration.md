# TypeScript migration

This file records the TypeScript migration decisions. The task checklist lives
in `documentation/TODO.md` under P1.4.5 through P1.4.8.

## Decision

Introduce TypeScript incrementally. Do not rewrite the app, and do not add a
client bundler until browser modules are ready to use imports deliberately.

The current static client is playable and simple to deploy. The most valuable
first step is to stabilize data contracts and runtime validation, especially at
the Socket.IO boundary, before changing how the browser code is loaded.

## Principles

- Keep every step playable and deployable.
- Treat network input as untrusted until normalized.
- Keep shared public contracts in `shared/`.
- Prefer JSDoc and `checkJs` while contracts are still moving.
- Convert files to `.ts` only after the module boundary is stable.
- Replace broad `GF.*` namespace mutation only after a client build step exists.
- Keep source JSON types separate from resolved runtime game data.

## Sequence

1. Stabilize shared and server types.
2. Convert shared and server files to TypeScript.
3. Add a client build step.
4. Convert client modules incrementally.

Shared contracts and networking come first. Extracted client state and UI
modules come after the browser has an import path. Gameplay simulation comes
last because it has the largest behavioral surface.

## Build Tool Trigger

Do not add Vite or another bundler yet. Revisit this when one of these is true:

- client files are ready to import shared contracts at runtime
- cache-busted production bundles would simplify service worker updates
- converting many client modules to `.ts` would be less risky with a dev server
  and bundler

When a bundler is added, verify Socket.IO client loading, PWA manifest behavior,
service worker caching, static assets, Docker, and deployment in the same
change.
