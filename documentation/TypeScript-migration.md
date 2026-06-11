# TypeScript migration

P1.4 introduces TypeScript deliberately without converting the browser app to
modules yet.

## Current path

- Keep the app playable with the existing Express server and static client
  scripts.
- Keep `checkJs` enabled for server-side JavaScript and shared contracts.
- Put public data contracts and runtime payload guards in `shared/contracts.js`.
- Use JSDoc typedef imports from shared contracts while files remain `.js`.
- Convert files incrementally only when a module boundary is already clear.

## Migration order

1. Shared contracts and networking boundaries.
2. Server lobby, high score, and game model modules.
3. Extracted client state and UI modules after the browser has an import path.
4. Gameplay simulation files after public model and networking contracts are
   stable.

The broad `GF.*` namespace should stay in place until the client has a build
step. Replacing it with imports should happen as part of that build step, not as
ad hoc script-tag churn.

## Runtime validation

The server validates incoming Socket.IO payloads at the boundary for:

- player names and leave/rejoin intent
- key events and bullet snapshots
- player position snapshots
- obstacle damage
- game result submissions

Invalid payloads are ignored instead of being relayed or recorded.

## Build tool decision

Do not add Vite or another bundler yet. The static-file setup still serves the
game and PWA assets simply, and the current pain is contract drift rather than
module loading.

Revisit Vite when one of these becomes true:

- client files are ready to import shared contracts at runtime
- cache-busted production bundles would simplify service worker updates
- converting many client modules to `.ts` would be less risky with a dev server
  and bundler

When a bundler is added, verify service worker caching and Docker deployment in
the same change.
