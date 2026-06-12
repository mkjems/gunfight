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

async function loadClientLobbyFlow() {
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
        'flows/clientLobbyFlow.ts',
        'flows/clientLobbyFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientLobbyFlow.js')).href
    );

    return module.ClientLobbyFlow;
}

function createLobbyOptions(overrides = {}) {
    const calls = [];
    const options = {
        bullets: {
            clear() {
                calls.push('bullets.clear');
            }
        },
        players: {
            clearKeys() {
                calls.push('players.clearKeys');
            }
        },
        roundData: {
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
            resetRecordedResult() {
                calls.push('scoreKeeper.resetRecordedResult');
            }
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
        },
        socket: {
            emit(event) {
                calls.push(['socket.emit', event]);
            }
        },
        syncNameEditor() {
            calls.push('syncNameEditor');
        },
        timers: {
            clear(name) {
                calls.push(['timers.clear', name]);
            },
            clearMany(names) {
                calls.push(['timers.clearMany', names]);
            },
            has() {
                return false;
            },
            set(name, callback, delay) {
                calls.push(['timers.set', name, typeof callback, delay]);
                callback();
            }
        }
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

test('enters lobby state by clearing round activity and sync state', async function () {
    const flow = await loadClientLobbyFlow();
    const { calls, options } = createLobbyOptions();

    flow.enter(options);

    assert.deepEqual(plain(calls), [
        ['timers.clearMany', ['ritual', 'hit', 'reset', 'abandonedRequeue']],
        'roundIntro.clear',
        'roundData.resetRoundFlags',
        ['setRoundState', 'waiting'],
        'scoreKeeper.resetRecordedResult',
        'players.clearKeys',
        'bullets.clear',
        'syncNameEditor'
    ]);
});

test('schedules abandoned game requeue once', async function () {
    const flow = await loadClientLobbyFlow();
    const { calls, options } = createLobbyOptions();

    assert.equal(flow.scheduleAbandonedRequeue(options), true);
    assert.deepEqual(plain(calls), [
        ['timers.set', 'abandonedRequeue', 'function', 2500],
        ['socket.emit', 'requeue']
    ]);
});

test('does not schedule abandoned game requeue without socket or when pending', async function () {
    const flow = await loadClientLobbyFlow();
    const withoutSocket = createLobbyOptions({
        socket: null
    });
    const alreadyPending = createLobbyOptions({
        timers: {
            has() {
                return true;
            },
            set() {
                alreadyPending.calls.push('timers.set');
            }
        }
    });

    assert.equal(flow.scheduleAbandonedRequeue(withoutSocket.options), false);
    assert.equal(flow.scheduleAbandonedRequeue(alreadyPending.options), false);
    assert.deepEqual(withoutSocket.calls, []);
    assert.deepEqual(alreadyPending.calls, []);
});

test('clears abandoned game requeue timer', async function () {
    const flow = await loadClientLobbyFlow();
    const { calls, options } = createLobbyOptions();

    flow.clearAbandonedRequeue(options);

    assert.deepEqual(calls, [['timers.clear', 'abandonedRequeue']]);
});
