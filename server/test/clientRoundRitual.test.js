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

async function loadClientRoundRitual() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('config.ts', 'config.js', tempDirectory);
    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientRoundRitual.ts',
        'clientRoundRitual.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientRoundRitual.js')).href
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
        endGame() {
            calls.push('endGame');
        },
        hasMatchTimeExpired() {
            return false;
        },
        renderHud() {
            calls.push('renderHud');
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        resetScores: true,
        roundData: {
            clearObstacleDamage() {
                calls.push('roundData.clearObstacleDamage');
            },
            clearRoundEnd() {
                calls.push('roundData.clearRoundEnd');
            },
            getRoundEndsAt() {
                return null;
            },
            setRoundEndsAt(value) {
                calls.push(['roundData.setRoundEndsAt', typeof value]);
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
        scheduleMatchEnd() {
            calls.push('scheduleMatchEnd');
        },
        scoreKeeper: {
            resetScores() {
                calls.push('scoreKeeper.resetScores');
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
        'scoreKeeper.resetScores',
        'roundData.clearRoundEnd',
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

    assert.deepEqual(calls.slice(12), [
        'roundIntro.complete',
        ['setRoundMessage', 'DRAW!'],
        ['timer.set', 'ritual', 700],
        ['setRoundMessage', ''],
        ['roundData.setRoundEndsAt', 'number'],
        'scheduleMatchEnd',
        'resetAmmo',
        ['setRoundState', 'playing'],
        'renderHud'
    ]);
});
