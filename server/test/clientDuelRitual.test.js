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

async function loadClientDuelRitual() {
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
        'flows/clientDuelRitual.ts',
        'flows/clientDuelRitual.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientDuelRitual.js'))
            .href
    );

    return module.ClientDuelRitual;
}

function createOptions() {
    const calls = [];
    const scheduled = [];
    const options = {
        bullets: {
            reset() {
                calls.push('bullets.reset');
            }
        },
        calls,
        closeNameEditor() {
            calls.push('closeNameEditor');
        },
        getServerPhase() {
            return 'duelIntro';
        },
        renderHud() {
            calls.push('renderHud');
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        duelData: {
            clearObstacleDamage() {
                calls.push('duelData.clearObstacleDamage');
            },
            startScenario() {
                calls.push('duelData.startScenario');
            }
        },
        duelIntro: {
            complete() {
                calls.push('duelIntro.complete');
            },
            start() {
                calls.push('duelIntro.start');
            }
        },
        setDuelMessage(message) {
            calls.push(['setDuelMessage', message]);
        },
        setDuelState(state) {
            calls.push(['setDuelState', state]);
        },
        timers: {
            set(name, callback, delay) {
                scheduled.push({ callback, delay, name });
                calls.push(['timer.set', name, delay]);
            }
        }
    };

    return { calls, options, scheduled };
}

test('starts the get-ready ritual and schedules draw', async function () {
    const ritual = await loadClientDuelRitual();
    const { calls, options, scheduled } = createOptions();

    ritual.start(options);

    assert.deepEqual(calls, [
        ['setDuelState', 'ritual'],
        'closeNameEditor',
        'duelData.startScenario',
        'duelData.clearObstacleDamage',
        'bullets.reset',
        'resetAmmo',
        'duelIntro.start',
        ['setDuelMessage', 'GET READY'],
        'renderHud',
        ['timer.set', 'ritual', 1500]
    ]);
    assert.equal(scheduled.length, 1);
});

test('moves from draw to playing after ritual timers', async function () {
    const ritual = await loadClientDuelRitual();
    const { calls, options, scheduled } = createOptions();

    ritual.start(options);
    scheduled[0].callback();
    scheduled[1].callback();

    assert.deepEqual(calls.slice(10), [
        'duelIntro.complete',
        ['setDuelMessage', 'DRAW!'],
        ['timer.set', 'ritual', 700],
        ['setDuelMessage', ''],
        'resetAmmo',
        ['setDuelState', 'playing'],
        'renderHud'
    ]);
});

test('skips stale get-ready timer after server phase leaves duel intro', async function () {
    const ritual = await loadClientDuelRitual();
    const { calls, options, scheduled } = createOptions();
    let serverPhase = 'duelIntro';

    options.getServerPhase = function () {
        return serverPhase;
    };

    ritual.start(options);
    serverPhase = 'gameOver';
    scheduled[0].callback();

    assert.deepEqual(calls.slice(10), []);
});

test('enters playing when a late get-ready timer sees server playing', async function () {
    const ritual = await loadClientDuelRitual();
    const { calls, options, scheduled } = createOptions();
    let serverPhase = 'duelIntro';

    options.getServerPhase = function () {
        return serverPhase;
    };

    ritual.start(options);
    serverPhase = 'playing';
    scheduled[0].callback();

    assert.deepEqual(calls.slice(10), [
        ['setDuelMessage', ''],
        'resetAmmo',
        ['setDuelState', 'playing'],
        'renderHud'
    ]);
    assert.equal(scheduled.length, 1);
});

test('skips stale draw timer after server phase leaves duel intro or playing', async function () {
    const ritual = await loadClientDuelRitual();
    const { calls, options, scheduled } = createOptions();
    let serverPhase = 'duelIntro';

    options.getServerPhase = function () {
        return serverPhase;
    };

    ritual.start(options);
    scheduled[0].callback();
    serverPhase = 'hitPause';
    scheduled[1].callback();

    assert.deepEqual(calls.slice(10), [
        'duelIntro.complete',
        ['setDuelMessage', 'DRAW!'],
        ['timer.set', 'ritual', 700]
    ]);
});
