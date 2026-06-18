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

async function loadClientDuelEndFlow() {
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
        'state/clientTimers.ts',
        'state/clientTimers.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientDuelEndFlow.ts',
        'flows/clientDuelEndFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientDuelEndFlow.js'))
            .href
    );

    return module.ClientDuelEndFlow;
}

function createDuelOptions(overrides = {}) {
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
            duelNumber: 3
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
        resetDuel() {},
        resetToStartScreen() {},
        duelData: {
            clearDuelPauseFlags() {
                calls.push('duelData.clearDuelPauseFlags');
            },
            resetDuelFlags() {
                calls.push('duelData.resetDuelFlags');
            }
        },
        duelIntro: {
            clear() {
                calls.push('duelIntro.clear');
            }
        },
        scoreKeeper: {
            getGameOverMessage(clients, getClientName) {
                calls.push(['scoreKeeper.getGameOverMessage', clients.length]);

                return getClientName(clients[0]) + ' WINS 3-1';
            }
        },
        setDuelMessage(message) {
            calls.push(['setDuelMessage', message]);
        },
        setDuelState(state) {
            calls.push(['setDuelState', state]);
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

test('ends a duel by scoring the winner and scheduling the reset', async function () {
    const flow = await loadClientDuelEndFlow();
    const { calls, options } = createDuelOptions();

    flow.endDuel(options);

    assert.deepEqual(plain(calls), [
        ['setDuelState', 'duelOver'],
        'closeNameEditor',
        'duelData.clearDuelPauseFlags',
        ['setDuelMessage', 'PLAYER 1 WINS'],
        'renderHud',
        'players.clearKeys',
        'bullets.clear',
        ['timers.clearMany', ['reset', 'matchEnd', 'ritual', 'hit']],
        'duelIntro.clear',
        ['timers.set', 'reset', 'function', 1800]
    ]);
});

test('ends a duel on time without adding a point', async function () {
    const flow = await loadClientDuelEndFlow();
    const { calls, options } = createDuelOptions({
        winnerId: null
    });

    flow.endDuel(options);

    assert.equal(
        calls.some(function (call) {
            return Array.isArray(call) && call[0] === 'scoreKeeper.addPoint';
        }),
        false
    );
    assert.deepEqual(calls.slice(0, 4), [
        ['setDuelState', 'duelOver'],
        'closeNameEditor',
        'duelData.clearDuelPauseFlags',
        ['setDuelMessage', 'TIME']
    ]);
});

test('ends the game and schedules the start reset without notifying the server', async function () {
    const flow = await loadClientDuelEndFlow();
    const { calls, options } = createDuelOptions();

    flow.endGame(options);

    assert.deepEqual(plain(calls), [
        ['setDuelState', 'gameOver'],
        'closeNameEditor',
        'duelData.resetDuelFlags',
        ['scoreKeeper.getGameOverMessage', 2],
        ['setDuelMessage', 'Ada WINS 3-1'],
        'renderHud',
        'players.clearKeys',
        'bullets.clear',
        ['timers.clearMany', ['reset', 'matchEnd', 'ritual', 'hit']],
        'duelIntro.clear',
        ['timers.set', 'reset', 'function', 5000]
    ]);
});

test('ends the game with the start-screen reset callback when available', async function () {
    const flow = await loadClientDuelEndFlow();
    const resetCallbacks = [];
    const resetDuel = function resetDuel() {};
    const resetToStartScreen = function resetToStartScreen() {};
    const { options } = createDuelOptions({
        resetDuel,
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

test('does not schedule a game-over reset without a reset callback', async function () {
    const flow = await loadClientDuelEndFlow();
    const { calls, options } = createDuelOptions({
        resetDuel: undefined,
        resetToStartScreen: undefined
    });

    flow.endGame(options);

    assert.equal(
        calls.some(function (call) {
            return Array.isArray(call) && call[0] === 'timers.set';
        }),
        false
    );
});
