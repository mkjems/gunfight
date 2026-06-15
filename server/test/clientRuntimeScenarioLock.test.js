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

async function loadClientGameRuntime() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'runtime/game/payloadGuards.ts',
        'runtime/game/payloadGuards.js',
        tempDirectory
    );
    compileClientModule(
        'runtime/game/runtime.ts',
        'runtime/game/runtime.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'runtime/game/runtime.js')).href
    );

    return module.ClientGameRuntime;
}

function createRuntime(ClientGameRuntime, dependencyOverrides = {}) {
    const dependencies = {
        ClientLobbyFlow: {
            enter() {}
        },
        ClientModelUpdateFlow: {
            sync() {}
        },
        ClientRoundEndFlow: {
            endGame() {}
        },
        ClientRoundRitual: {
            start() {}
        },
        ClientScreens: {
            RoundState: {
                GAME_OVER: 'gameOver',
                PLAYING: 'playing',
                WAITING: 'waiting'
            }
        },
        ...dependencyOverrides
    };
    const runtime = new ClientGameRuntime({
        dependencies,
        document: {},
        ImageCtor: function ImageCtor() {},
        window: {}
    });

    runtime.bullets = {};
    runtime.players = {
        all: {}
    };
    runtime.roundData = {
        clearHitMessage() {},
        hasMatchTimeExpired() {
            return false;
        },
        setRoundEndsAt() {
            return undefined;
        }
    };
    runtime.roundIntro = {};
    runtime.scoreKeeper = {
        setScores() {}
    };
    runtime.timers = {};
    runtime.gameSounds = {
        playReady() {}
    };

    return runtime;
}

test('keeps the active scenario visible until the next round ritual starts', async function () {
    const ClientGameRuntime = await loadClientGameRuntime();
    const runtime = createRuntime(ClientGameRuntime);
    const firstScenario = { id: 'first' };
    const nextScenario = { id: 'next' };

    runtime.latestModel = {
        clients: [],
        currentScenario: firstScenario
    };
    runtime.startRoundRitual();

    runtime.latestModel = {
        clients: [],
        currentScenario: nextScenario
    };

    assert.equal(runtime.getCurrentScenario(), firstScenario);

    runtime.startRoundRitual();

    assert.equal(runtime.getCurrentScenario(), nextScenario);
});

test('does not use local match expiry during server-owned round ritual', async function () {
    const ClientGameRuntime = await loadClientGameRuntime();
    let ritualOptions = null;
    const runtime = createRuntime(ClientGameRuntime, {
        ClientRoundRitual: {
            start(options) {
                ritualOptions = options;
            }
        }
    });

    runtime.roundData.hasMatchTimeExpired = function () {
        return true;
    };
    runtime.latestModel = {
        clients: [],
        currentScenario: {},
        phase: 'roundIntro'
    };

    runtime.startRoundRitual();

    const capturedRitualOptions = ritualOptions;

    if (capturedRitualOptions === null) {
        throw new Error('Expected round ritual options to be captured');
    }

    assert.equal(capturedRitualOptions.hasMatchTimeExpired(), false);
});

test('does not notify match expiry from server-owned lifecycle models', async function () {
    const ClientGameRuntime = await loadClientGameRuntime();
    let endGameOptions = null;
    const runtime = createRuntime(ClientGameRuntime, {
        ClientRoundEndFlow: {
            endGame(options) {
                endGameOptions = options;
            }
        }
    });

    runtime.latestModel = {
        clients: [],
        phase: 'playing'
    };

    runtime.endGame();

    const capturedEndGameOptions = endGameOptions;

    if (capturedEndGameOptions === null) {
        throw new Error('Expected end-game options to be captured');
    }

    assert.equal(capturedEndGameOptions.notifyServer, false);
    assert.equal(capturedEndGameOptions.resetToStartScreen, undefined);
});

test('ignores stale model updates by server version', async function () {
    const ClientGameRuntime = await loadClientGameRuntime();
    const syncCalls = [];
    const scoreCalls = [];
    const runtime = createRuntime(ClientGameRuntime, {
        ClientModelUpdateFlow: {
            sync(options) {
                syncCalls.push(options.model.version);
            }
        }
    });

    runtime.scoreKeeper.setScores = function (scores) {
        scoreCalls.push(scores);
    };
    runtime.latestModel = {
        clients: [{ id: 'p1', name: 'ACE', slot: 0 }],
        gameId: 'G0001',
        phase: 'readying',
        scores: [0, 0],
        version: 7
    };

    runtime.onModelUpdate({
        clients: [{ id: 'p1', name: 'STALE', slot: 0 }],
        gameId: 'G0001',
        phase: 'readying',
        scores: [9, 9],
        version: 7
    });

    assert.deepEqual(syncCalls, []);
    assert.deepEqual(scoreCalls, []);
    assert.equal(runtime.latestModel.clients[0].name, 'ACE');
    assert.deepEqual(runtime.latestModel.scores, [0, 0]);
});

test('applies fresh same-phase model updates', async function () {
    const ClientGameRuntime = await loadClientGameRuntime();
    const syncCalls = [];
    const scoreCalls = [];
    const runtime = createRuntime(ClientGameRuntime, {
        ClientModelUpdateFlow: {
            sync(options) {
                syncCalls.push({
                    previousVersion: options.previousModel.version,
                    version: options.model.version
                });
            }
        }
    });

    runtime.scoreKeeper.setScores = function (scores) {
        scoreCalls.push(scores);
    };
    runtime.latestModel = {
        clients: [{ id: 'p1', name: 'ACE', slot: 0 }],
        gameId: 'G0001',
        phase: 'readying',
        scores: [0, 0],
        version: 7
    };

    runtime.onModelUpdate({
        clients: [{ id: 'p1', name: 'FRESH', ready: true, slot: 0 }],
        gameId: 'G0001',
        matchState: 'idle',
        phase: 'readying',
        phaseStartedAt: 1000,
        roundNumber: 0,
        scores: [1, 0],
        version: 8
    });

    assert.deepEqual(syncCalls, [{ previousVersion: 7, version: 8 }]);
    assert.deepEqual(scoreCalls, [[1, 0]]);
    assert.equal(runtime.latestModel.clients[0].name, 'FRESH');
    assert.equal(runtime.latestModel.clients[0].ready, true);
    assert.deepEqual(runtime.latestModel.scores, [1, 0]);
    assert.equal(runtime.latestModel.version, 8);
});
