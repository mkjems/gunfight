import {
    flattenDependencies,
    type ClientGameDependencies
} from './game/dependencies.js';
import { ClientGameRuntime } from './game/runtime.js';
import type { ClientGameBrowser, ClientGameController } from './game/types.js';

export type { ClientGameDependencies } from './game/dependencies.js';
export type { ClientGameBrowser, ClientGameController } from './game/types.js';

export function createGame(
    groupedDependencies: ClientGameDependencies,
    browser: ClientGameBrowser = {}
): ClientGameController {
    const dependencies = flattenDependencies(groupedDependencies);
    const runtime = new ClientGameRuntime({
        dependencies,
        document: browser.document || globalThis.document,
        ImageCtor: browser.Image || globalThis.Image,
        window: browser.window || globalThis.window
    });

    runtime.connectStartLifecycle();

    return runtime;
}
