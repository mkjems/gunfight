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

async function loadClientTouchState() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientTouchState.ts',
        'clientTouchState.js',
        tempDirectory
    );
    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientTouchState.js')).href
    );

    return module.ClientTouchState;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('builds touch state for waiting lobby screens', async function () {
    const touchState = await loadClientTouchState();

    assert.deepEqual(
        plain(
            touchState.getTouchState({
                aimLevel: 4,
                editing: false,
                highScoresVisible: true,
                ready: false,
                roundState: 'waiting'
            })
        ),
        {
            gameplay: false,
            waiting: true,
            playing: false,
            editing: false,
            highScoresVisible: true,
            ready: false,
            aimLevel: 4
        }
    );
});

test('builds touch state for active gameplay screens', async function () {
    const touchState = await loadClientTouchState();

    assert.deepEqual(
        plain(
            touchState.getTouchState({
                aimLevel: 2,
                editing: true,
                highScoresVisible: true,
                ready: true,
                roundState: 'playing'
            })
        ),
        {
            gameplay: true,
            waiting: false,
            playing: true,
            editing: true,
            highScoresVisible: false,
            ready: true,
            aimLevel: 2
        }
    );
});

test('shows gameplay touch controls during transitional round states', async function () {
    const touchState = await loadClientTouchState();

    assert.equal(touchState.shouldShowGameplayTouchControls('ritual'), true);
    assert.equal(touchState.shouldShowGameplayTouchControls('hitPause'), true);
    assert.equal(touchState.shouldShowGameplayTouchControls('roundOver'), true);
    assert.equal(touchState.shouldShowGameplayTouchControls('gameOver'), false);
});
