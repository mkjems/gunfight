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

async function loadClientTouchControlsFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientTouchState.ts',
        'clientTouchState.js',
        tempDirectory
    );
    compileClientModule(
        'clientTouchControlsFlow.ts',
        'clientTouchControlsFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientTouchControlsFlow.js'))
            .href
    );

    return module.ClientTouchControlsFlow;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('reads local aim from the active player', async function () {
    const flow = await loadClientTouchControlsFlow();

    assert.equal(
        flow.getLocalAimLevel({
            defaultAim: 3,
            player: {
                getAim() {
                    return 5;
                }
            }
        }),
        5
    );
});

test('falls back to default aim without an active player', async function () {
    const flow = await loadClientTouchControlsFlow();

    assert.equal(
        flow.getLocalAimLevel({
            defaultAim: 3,
            player: null
        }),
        3
    );
});

test('updates touch controls with derived touch state', async function () {
    const flow = await loadClientTouchControlsFlow();
    const calls = [];

    assert.equal(
        flow.update({
            aimLevel: 4,
            editing: false,
            highScoresVisible: true,
            getTouchState(options) {
                return {
                    touchState: options
                };
            },
            ready: false,
            roundState: 'waiting',
            touchControls: {
                update(state) {
                    calls.push(state);
                }
            }
        }),
        true
    );

    assert.deepEqual(plain(calls), [
        {
            touchState: {
                aimLevel: 4,
                editing: false,
                highScoresVisible: true,
                ready: false,
                roundState: 'waiting'
            }
        }
    ]);
});

test('does not update missing touch controls', async function () {
    const flow = await loadClientTouchControlsFlow();

    assert.equal(
        flow.update({
            touchControls: null
        }),
        false
    );
});
