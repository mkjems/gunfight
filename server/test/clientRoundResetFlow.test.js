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

async function loadClientRoundResetFlow() {
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
        'flows/clientRoundResetFlow.ts',
        'flows/clientRoundResetFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientRoundResetFlow.js'))
            .href
    );

    return module.ClientRoundResetFlow;
}

function createResetOptions(overrides = {}) {
    const calls = [];
    const options = {
        bullets: {
            reset() {
                calls.push('bullets.reset');
            }
        },
        players: {
            resetAll(options) {
                calls.push(['players.resetAll', options.slots]);
            }
        },
        renderHud() {
            calls.push('renderHud');
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        roundData: {
            resetRoundFlags() {
                calls.push('roundData.resetRoundFlags');
            }
        },
        setRoundMessage(message) {
            calls.push(['setRoundMessage', message]);
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
        },
        syncNameEditor() {
            calls.push('syncNameEditor');
        },
        timers: {
            clearMany(names) {
                calls.push(['timers.clearMany', names]);
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

test('resets a round back to waiting', async function () {
    const flow = await loadClientRoundResetFlow();
    const { calls, options } = createResetOptions();

    flow.resetRound(options);

    assert.deepEqual(plain(calls), [
        [
            'players.resetAll',
            [
                {
                    x: 150,
                    y: 400,
                    facing: 1,
                    frame: 0,
                    movementBounds: {
                        minX: 106,
                        maxX: 310,
                        minY: 320,
                        maxY: 440
                    }
                },
                {
                    x: 800,
                    y: 400,
                    facing: -1,
                    frame: 2,
                    movementBounds: {
                        minX: 640,
                        maxX: 844,
                        minY: 320,
                        maxY: 440
                    }
                }
            ]
        ],
        'bullets.reset',
        ['setRoundMessage', ''],
        'roundData.resetRoundFlags',
        ['timers.clearMany', ['reset', 'matchEnd']],
        ['setRoundState', 'waiting'],
        'syncNameEditor',
        'renderHud'
    ]);
});

test('resets the game over screen back to the lobby start screen', async function () {
    const flow = await loadClientRoundResetFlow();
    const { calls, options } = createResetOptions();

    flow.resetToStartScreen(options);

    assert.deepEqual(plain(calls), [
        [
            'players.resetAll',
            [
                {
                    x: 150,
                    y: 400,
                    facing: 1,
                    frame: 0,
                    movementBounds: {
                        minX: 106,
                        maxX: 310,
                        minY: 320,
                        maxY: 440
                    }
                },
                {
                    x: 800,
                    y: 400,
                    facing: -1,
                    frame: 2,
                    movementBounds: {
                        minX: 640,
                        maxX: 844,
                        minY: 320,
                        maxY: 440
                    }
                }
            ]
        ],
        'bullets.reset',
        ['setRoundMessage', ''],
        'roundData.resetRoundFlags',
        ['timers.clearMany', ['reset', 'matchEnd']],
        'resetAmmo',
        ['setRoundState', 'waiting'],
        'syncNameEditor',
        'renderHud'
    ]);
});
