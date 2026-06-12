import { ClientRuntimeDependencies } from './modules/clientRuntimeDependencies.js';
import { createGame } from './modules/game.js';

type GlobalWithSocketIo = typeof globalThis & {
    io?: unknown;
};

function loadScript(src: string): Promise<void> {
    if (
        src === '/socket.io/socket.io.js' &&
        (globalThis as GlobalWithSocketIo).io
    ) {
        return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
        const script = document.createElement('script');

        script.src = src;
        script.onload = function () {
            resolve();
        };
        script.onerror = function () {
            reject(new Error('Unable to load ' + src));
        };
        document.head.appendChild(script);
    });
}

await loadScript('/socket.io/socket.io.js');

createGame(ClientRuntimeDependencies, {
    document,
    Image,
    window
});
