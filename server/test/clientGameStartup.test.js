import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    writeFileSync(
        path.join(tempDirectory, outputName),
        transpiled.outputText,
        'utf8'
    );
}

async function loadCreateGame() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('game.ts', 'game.js', tempDirectory);

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'game.js')).href
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
                this.sprites = {
                    ammo: {},
                    cactus: {},
                    saloon: {},
                    wagon: {}
                };
                this.getRockPattern = function () {
                    return null;
                };
                this.load = function () {};
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
            ClientGameLoop: function () {},
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
                this.socket = {};
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
                        gameHud: {},
                        gameHudScreen: {},
                        highScoresScreen: {},
                        lobbyHud: {},
                        lobbyScreen: {},
                        nameEditorScreen: {}
                    };
                }
            }
        },
        browserConstructors: {
            Camera: function () {},
            ClientCameraController: function () {
                this.getCameraScale = function () {
                    return 1;
                };
            },
            ClientGameSounds: function () {
                this.playRicochet = function () {};
            },
            ClientIdentity: function () {},
            ClientTouchEnvironment: {},
            CollisionDebugRenderer: function () {},
            KeysModel: function () {},
            NameEditor: function () {
                this.isActive = function () {
                    return false;
                };
            },
            ScenarioRenderer: function () {},
            SoundEffects: function () {},
            TouchControls: function () {}
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
