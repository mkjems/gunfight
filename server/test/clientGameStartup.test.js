import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

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

function loadClientGame(readyState) {
    const document = createDocument(readyState);
    let networkStarts = 0;
    const source = readFileSync(
        new URL('../../client/js/index.js', import.meta.url),
        'utf8'
    );
    const context = {
        GF: {
            AmmoHudRenderer: function () {},
            Camera: function () {},
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
            ClientCameraController: function () {
                this.getCameraScale = function () {
                    return 1;
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
            ClientGameSounds: function () {
                this.playRicochet = function () {};
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
            ClientHudOverlay: {
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
            },
            ClientIdentity: function () {},
            ClientNetwork: function () {
                networkStarts += 1;
                this.socket = {};
            },
            ClientScreens: {
                RoundState: {
                    WAITING: 'waiting'
                }
            },
            CollisionDebugRenderer: function () {},
            Config: {
                canvas: {
                    height: 200,
                    width: 300
                },
                game: {
                    seconds: 60
                }
            },
            NameEditor: function () {
                this.isActive = function () {
                    return false;
                };
            },
            ScenarioRenderer: function () {},
            SoundEffects: function () {}
        },
        document: document,
        Image: function () {},
        window: {
            localStorage: {}
        }
    };

    vm.runInNewContext(source, context);

    return {
        document: document,
        getNetworkStarts() {
            return networkStarts;
        },
        game: context.GF.Game
    };
}

test('starts immediately when the document is already ready', function () {
    const loaded = loadClientGame('interactive');

    assert.equal(loaded.getNetworkStarts(), 1);

    loaded.game.start();

    assert.equal(loaded.getNetworkStarts(), 1);
});

test('starts once from DOMContentLoaded when the document is loading', function () {
    const loaded = loadClientGame('loading');

    assert.equal(loaded.getNetworkStarts(), 0);

    loaded.document.fireDomContentLoaded();
    loaded.document.fireDomContentLoaded();
    loaded.game.start();

    assert.equal(loaded.getNetworkStarts(), 1);
});
