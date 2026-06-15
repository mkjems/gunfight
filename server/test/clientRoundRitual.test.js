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

async function loadClientRoundRitual() {
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
        'flows/clientRoundRitual.ts',
        'flows/clientRoundRitual.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientRoundRitual.js'))
            .href
    );

    return module.ClientRoundRitual;
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
            return 'roundIntro';
        },
        renderHud() {
            calls.push('renderHud');
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        roundData: {
            clearObstacleDamage() {
                calls.push('roundData.clearObstacleDamage');
            },
            startScenario() {
                calls.push('roundData.startScenario');
            }
        },
        roundIntro: {
            complete() {
                calls.push('roundIntro.complete');
            },
            start() {
                calls.push('roundIntro.start');
            }
        },
        setRoundMessage(message) {
            calls.push(['setRoundMessage', message]);
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
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
    const ritual = await loadClientRoundRitual();
    const { calls, options, scheduled } = createOptions();

    ritual.start(options);

    assert.deepEqual(calls, [
        ['setRoundState', 'ritual'],
        'closeNameEditor',
        'roundData.startScenario',
        'roundData.clearObstacleDamage',
        'bullets.reset',
        'resetAmmo',
        'roundIntro.start',
        ['setRoundMessage', 'GET READY'],
        'renderHud',
        ['timer.set', 'ritual', 1500]
    ]);
    assert.equal(scheduled.length, 1);
});

test('moves from draw to playing after ritual timers', async function () {
    const ritual = await loadClientRoundRitual();
    const { calls, options, scheduled } = createOptions();

    ritual.start(options);
    scheduled[0].callback();
    scheduled[1].callback();

    assert.deepEqual(calls.slice(10), [
        'roundIntro.complete',
        ['setRoundMessage', 'DRAW!'],
        ['timer.set', 'ritual', 700],
        ['setRoundMessage', ''],
        'resetAmmo',
        ['setRoundState', 'playing'],
        'renderHud'
    ]);
});

test('skips stale get-ready timer after server phase leaves round intro', async function () {
    const ritual = await loadClientRoundRitual();
    const { calls, options, scheduled } = createOptions();
    let serverPhase = 'roundIntro';

    options.getServerPhase = function () {
        return serverPhase;
    };

    ritual.start(options);
    serverPhase = 'gameOver';
    scheduled[0].callback();

    assert.deepEqual(calls.slice(10), []);
});

test('enters playing when a late get-ready timer sees server playing', async function () {
    const ritual = await loadClientRoundRitual();
    const { calls, options, scheduled } = createOptions();
    let serverPhase = 'roundIntro';

    options.getServerPhase = function () {
        return serverPhase;
    };

    ritual.start(options);
    serverPhase = 'playing';
    scheduled[0].callback();

    assert.deepEqual(calls.slice(10), [
        ['setRoundMessage', ''],
        'resetAmmo',
        ['setRoundState', 'playing'],
        'renderHud'
    ]);
    assert.equal(scheduled.length, 1);
});

test('skips stale draw timer after server phase leaves round intro or playing', async function () {
    const ritual = await loadClientRoundRitual();
    const { calls, options, scheduled } = createOptions();
    let serverPhase = 'roundIntro';

    options.getServerPhase = function () {
        return serverPhase;
    };

    ritual.start(options);
    scheduled[0].callback();
    serverPhase = 'hitPause';
    scheduled[1].callback();

    assert.deepEqual(calls.slice(10), [
        'roundIntro.complete',
        ['setRoundMessage', 'DRAW!'],
        ['timer.set', 'ritual', 700]
    ]);
});
