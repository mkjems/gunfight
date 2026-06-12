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

async function loadClientRoundEndFlow() {
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
        'flows/clientRoundEndFlow.ts',
        'flows/clientRoundEndFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientRoundEndFlow.js'))
            .href
    );

    return module.ClientRoundEndFlow;
}

function createRoundOptions(overrides = {}) {
    const calls = [];
    const options = {
        bullets: {
            clear() {
                calls.push('bullets.clear');
            }
        },
        closeNameEditor() {
            calls.push('closeNameEditor');
        },
        getClientName(client) {
            return client.name;
        },
        getPlayerSlot(id) {
            return id === 'p1' ? 0 : -1;
        },
        model: {
            clients: [
                {
                    name: 'Ada',
                    slot: 0
                },
                {
                    name: 'Grace',
                    slot: 1
                }
            ],
            gameId: 'game-1',
            roundNumber: 3
        },
        players: {
            clearKeys() {
                calls.push('players.clearKeys');
            },
            label(id) {
                return id === 'p1' ? '1' : '?';
            }
        },
        renderHud() {
            calls.push('renderHud');
        },
        resetRound() {},
        resetToStartScreen() {},
        roundData: {
            clearRoundPauseFlags() {
                calls.push('roundData.clearRoundPauseFlags');
            },
            resetRoundFlags() {
                calls.push('roundData.resetRoundFlags');
            }
        },
        roundIntro: {
            clear() {
                calls.push('roundIntro.clear');
            }
        },
        scoreKeeper: {
            addPoint(slot) {
                calls.push(['scoreKeeper.addPoint', slot]);
            },
            createGameResult(model, getClientName) {
                calls.push(['scoreKeeper.createGameResult', model.gameId]);

                return {
                    resultId: model.gameId + ':' + model.roundNumber,
                    winner: getClientName(model.clients[0])
                };
            },
            getGameOverMessage(clients, getClientName) {
                calls.push(['scoreKeeper.getGameOverMessage', clients.length]);

                return getClientName(clients[0]) + ' WINS 3-1';
            }
        },
        setRoundMessage(message) {
            calls.push(['setRoundMessage', message]);
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
        },
        socket: {
            emit(event, payload) {
                calls.push(['socket.emit', event, payload.resultId]);
            }
        },
        timers: {
            clearMany(names) {
                calls.push(['timers.clearMany', names]);
            },
            set(name, callback, delay) {
                calls.push(['timers.set', name, typeof callback, delay]);
            }
        },
        winnerId: 'p1'
    };

    return {
        calls,
        options: {
            ...options,
            ...overrides
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('ends a round by scoring the winner and scheduling the reset', async function () {
    const flow = await loadClientRoundEndFlow();
    const { calls, options } = createRoundOptions();

    flow.endRound(options);

    assert.deepEqual(plain(calls), [
        ['setRoundState', 'roundOver'],
        'closeNameEditor',
        'roundData.clearRoundPauseFlags',
        ['scoreKeeper.addPoint', 0],
        ['setRoundMessage', 'PLAYER 1 WINS'],
        'renderHud',
        'players.clearKeys',
        'bullets.clear',
        ['timers.clearMany', ['reset', 'matchEnd', 'ritual', 'hit']],
        'roundIntro.clear',
        ['timers.set', 'reset', 'function', 1800]
    ]);
});

test('ends a round on time without adding a point', async function () {
    const flow = await loadClientRoundEndFlow();
    const { calls, options } = createRoundOptions({
        winnerId: null
    });

    flow.endRound(options);

    assert.equal(
        calls.some(function (call) {
            return Array.isArray(call) && call[0] === 'scoreKeeper.addPoint';
        }),
        false
    );
    assert.deepEqual(calls.slice(0, 4), [
        ['setRoundState', 'roundOver'],
        'closeNameEditor',
        'roundData.clearRoundPauseFlags',
        ['setRoundMessage', 'TIME']
    ]);
});

test('ends the game by recording the result and scheduling the start reset', async function () {
    const flow = await loadClientRoundEndFlow();
    const { calls, options } = createRoundOptions();

    flow.endGame(options);

    assert.deepEqual(plain(calls), [
        ['setRoundState', 'gameOver'],
        'closeNameEditor',
        ['scoreKeeper.createGameResult', 'game-1'],
        ['socket.emit', 'recordGameResult', 'game-1:3'],
        'roundData.resetRoundFlags',
        ['scoreKeeper.getGameOverMessage', 2],
        ['setRoundMessage', 'Ada WINS 3-1'],
        'renderHud',
        'players.clearKeys',
        'bullets.clear',
        ['timers.clearMany', ['reset', 'matchEnd', 'ritual', 'hit']],
        'roundIntro.clear',
        ['timers.set', 'reset', 'function', 5000]
    ]);
});

test('ends the game with the start-screen reset callback when available', async function () {
    const flow = await loadClientRoundEndFlow();
    const resetCallbacks = [];
    const resetRound = function resetRound() {};
    const resetToStartScreen = function resetToStartScreen() {};
    const { options } = createRoundOptions({
        resetRound,
        resetToStartScreen,
        timers: {
            clearMany() {},
            set(name, callback) {
                resetCallbacks.push([name, callback]);
            }
        }
    });

    flow.endGame(options);

    assert.deepEqual(resetCallbacks, [['reset', resetToStartScreen]]);
});

test('does not record a game result without a socket or result payload', async function () {
    const flow = await loadClientRoundEndFlow();
    const withoutSocket = createRoundOptions({
        socket: null
    });
    const withoutResult = createRoundOptions({
        scoreKeeper: {
            createGameResult() {
                withoutResult.calls.push('scoreKeeper.createGameResult');

                return null;
            }
        }
    });

    assert.equal(flow.recordGameResult(withoutSocket.options), false);
    assert.equal(flow.recordGameResult(withoutResult.options), false);
    assert.deepEqual(withoutSocket.calls, []);
    assert.deepEqual(withoutResult.calls, ['scoreKeeper.createGameResult']);
});
