import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    const outputPath = path.join(tempDirectory, outputName);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, transpiled.outputText, 'utf8');
}

async function loadCreateGame() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('runtime/game.ts', 'runtime/game.js', tempDirectory);

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'runtime/game.js')).href
    );

    return module.createGame;
}

function createDocument(readyState) {
    let domContentLoadedCallback = null;

    return {
        readyState: readyState,
        addEventListener(eventName, callback) {
            if (eventName === 'DOMContentLoaded') {
                domContentLoadedCallback = callback;
            }
        },
        fireDomContentLoaded() {
            if (domContentLoadedCallback) {
                domContentLoadedCallback();
            }
        }
    };
}

async function loadClientGame(readyState) {
    const createGame = await loadCreateGame();
    const document = createDocument(readyState);
    let networkStarts = 0;
    const dependencies = createStartupDependencies(function () {
        networkStarts += 1;
    });
    const game = createGame(dependencies, {
        document: document,
        Image: function () {},
        window: {
            localStorage: {}
        }
    });

    return {
        document: document,
        getNetworkStarts() {
            return networkStarts;
        },
        game
    };
}

function createStartupDependencies(onNetworkStart) {
    return {
        bootstrap: {
            ClientAssets: function () {
                return {
                    sprites: {
                        ammo: {},
                        cactus: {},
                        saloon: {},
                        wagon: {}
                    },
                    getRockPattern() {
                        return null;
                    },
                    load() {}
                };
            },
            ClientCanvasSetup: {
                create() {
                    return {
                        canvas: {},
                        context: {},
                        hudCanvas: {},
                        hudContext: {}
                    };
                }
            },
            ClientGameLoop: function () {
                return {
                    start() {}
                };
            },
            ClientGameSystems: {
                create(options) {
                    return {
                        ammo: {},
                        bullets: {},
                        highScores: [],
                        localReadyRequested: false,
                        players: {},
                        positionSync: {},
                        roundData: {},
                        roundIntro: {},
                        roundState: options.initialRoundState,
                        scene: {},
                        scoreKeeper: {},
                        timers: {}
                    };
                }
            },
            ClientInputStartup: {},
            ClientNetwork: function () {
                onNetworkStart();
                return {
                    socket: {
                        emit() {},
                        on() {}
                    }
                };
            },
            requestAnimFrame: function () {}
        },
        environment: {
            CanvasTools: {},
            ClientCollisionEnvironment: {},
            Collision: {},
            Obstacles: {}
        },
        flow: {},
        model: {
            ClientLobbyViewModel: {},
            ClientModelSync: {},
            ClientScreens: {
                RoundState: {
                    WAITING: 'waiting'
                }
            }
        },
        platform: {
            Config: {
                canvas: {
                    height: 200,
                    width: 300
                },
                game: {
                    seconds: 60
                }
            }
        },
        ui: {
            AmmoHudRenderer: function () {},
            ClientHudFlow: {},
            ClientLobbyHudFlow: {},
            ClientUi: {
                create() {
                    return {
                        app: {},
                        installPrompt: {}
                    };
                }
            }
        },
        browserConstructors: {
            Camera: function () {},
            ClientCameraController: function () {
                return {
                    getCameraScale() {
                        return 1;
                    }
                };
            },
            ClientGameSounds: function () {
                return {
                    playRicochet() {}
                };
            },
            ClientIdentity: function () {
                return {
                    getStoredPlayerName() {
                        return '';
                    }
                };
            },
            ClientTouchEnvironment: {},
            CollisionDebugRenderer: function () {
                return {
                    render() {}
                };
            },
            KeysModel: function () {},
            NameEditor: function () {
                return {
                    isActive() {
                        return false;
                    }
                };
            },
            ScenarioRenderer: function () {
                return {};
            },
            SoundEffects: function () {},
            TouchControls: function () {
                return {
                    update() {}
                };
            }
        }
    };
}

test('starts immediately when the document is already ready', async function () {
    const loaded = await loadClientGame('interactive');

    assert.equal(loaded.getNetworkStarts(), 1);

    loaded.game.start();

    assert.equal(loaded.getNetworkStarts(), 1);
});

test('starts once from DOMContentLoaded when the document is loading', async function () {
    const loaded = await loadClientGame('loading');

    assert.equal(loaded.getNetworkStarts(), 0);

    loaded.document.fireDomContentLoaded();
    loaded.document.fireDomContentLoaded();
    loaded.game.start();

    assert.equal(loaded.getNetworkStarts(), 1);
});
