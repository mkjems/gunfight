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

async function loadClientRuntimeWithModelUpdateFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'platform/config.ts',
        'platform/config.js',
        tempDirectory
    );
    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'network/clientModelSync.ts',
        'network/clientModelSync.js',
        tempDirectory
    );
    compileClientModule(
        'network/clientModelUpdatePlan.ts',
        'network/clientModelUpdatePlan.js',
        tempDirectory
    );
    compileClientModule(
        'network/clientModelUpdateFlow.ts',
        'network/clientModelUpdateFlow.js',
        tempDirectory
    );
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

    const runtimeModule = await import(
        pathToFileURL(path.join(tempDirectory, 'runtime/game/runtime.js')).href
    );
    const flowModule = await import(
        pathToFileURL(
            path.join(tempDirectory, 'network/clientModelUpdateFlow.js')
        ).href
    );

    return {
        ClientGameRuntime: runtimeModule.ClientGameRuntime,
        ClientModelUpdateFlow: flowModule.ClientModelUpdateFlow
    };
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
    runtime.particleLayer = {
        clear() {}
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

test('follows server game-over and return-to-lobby model updates', async function () {
    const { ClientGameRuntime, ClientModelUpdateFlow } =
        await loadClientRuntimeWithModelUpdateFlow();
    const calls = [];
    const runtime = createRuntime(ClientGameRuntime, {
        ClientLobbyFlow: {
            clearAbandonedRequeue() {
                calls.push('clearAbandonedRequeue');
            },
            enter(options) {
                calls.push('enterLobbyState');
                options.setRoundState('waiting');
            },
            scheduleAbandonedRequeue() {
                calls.push('scheduleAbandonedRequeue');
            }
        },
        ClientModelUpdateFlow,
        ClientRoundEndFlow: {
            endGame(options) {
                calls.push(['endGame', options.notifyServer]);
                options.setRoundState('gameOver');
            }
        },
        ClientRoundTransition: {
            resolve(options) {
                calls.push([
                    'roundState',
                    options.currentState,
                    options.nextState
                ]);
                return options.nextState;
            }
        }
    });

    runtime.playerId = 'p1';
    runtime.roundState = 'playing';
    runtime.latestModel = {
        clients: [
            { id: 'p1', name: 'ACE', ready: true, slot: 0 },
            { id: 'p2', name: 'KID', ready: true, slot: 1 }
        ],
        gameId: 'G0001',
        matchState: 'playing',
        phase: 'playing',
        scores: [1, 0],
        version: 7
    };
    runtime.players.sync = function (model, options) {
        calls.push([
            'players.sync',
            model.phase,
            options.localPlayerFirst,
            options.resetExisting
        ]);
    };
    runtime.renderHud = function () {
        calls.push('renderHud');
    };
    runtime.syncNameEditor = function () {
        calls.push('syncNameEditor');
    };
    runtime.syncStoredPlayerName = function () {
        calls.push('syncStoredPlayerName');
    };
    runtime.roundData.setRoundEndsAt = function (endsAt) {
        calls.push(['setRoundEndsAt', endsAt]);
    };
    runtime.scoreKeeper.setScores = function (scores) {
        calls.push(['setScores', scores]);
    };

    runtime.onModelUpdate({
        clients: [
            { id: 'p1', name: 'ACE', ready: true, slot: 0 },
            { id: 'p2', name: 'KID', ready: true, slot: 1 }
        ],
        gameId: 'G0001',
        matchState: 'gameOver',
        phase: 'gameOver',
        scores: [1, 0],
        version: 8
    });

    runtime.onModelUpdate({
        clients: [
            { id: 'p1', name: 'ACE', ready: false, slot: 0 },
            { id: 'p2', name: 'KID', ready: false, slot: 1 }
        ],
        gameId: 'G0001',
        matchState: 'idle',
        phase: 'readying',
        scores: [0, 0],
        version: 9
    });

    assert.deepEqual(calls, [
        ['setScores', [1, 0]],
        ['setRoundEndsAt', null],
        'syncStoredPlayerName',
        'clearAbandonedRequeue',
        ['players.sync', 'gameOver', false, undefined],
        'syncNameEditor',
        'renderHud',
        ['endGame', false],
        ['roundState', 'playing', 'gameOver'],
        ['setScores', [0, 0]],
        ['setRoundEndsAt', null],
        'syncStoredPlayerName',
        'enterLobbyState',
        ['roundState', 'gameOver', 'waiting'],
        'clearAbandonedRequeue',
        ['players.sync', 'readying', true, true],
        'syncNameEditor',
        'renderHud'
    ]);
    assert.equal(runtime.roundState, 'waiting');
    assert.equal(runtime.latestModel.phase, 'readying');
    assert.deepEqual(runtime.latestModel.scores, [0, 0]);
});
