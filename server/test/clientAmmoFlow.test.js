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

async function loadClientAmmoFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientAmmoFlow.ts',
        'clientAmmoFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientAmmoFlow.js')).href
    );

    return module.ClientAmmoFlow;
}

function createOptions(overrides = {}) {
    const calls = [];
    const options = {
        ammo: {
            reloadIfAllEmpty(clients) {
                calls.push(['ammo.reloadIfAllEmpty', clients.length]);

                return true;
            }
        },
        model: {
            clients: [{ id: 'p1' }, { id: 'p2' }]
        },
        roundState: 'playing'
    };

    return {
        calls,
        options: {
            ...options,
            ...overrides
        }
    };
}

test('reloads when playing with both clients in the model', async function () {
    const flow = await loadClientAmmoFlow();
    const { calls, options } = createOptions();

    assert.equal(flow.reloadIfBothPlayersAreOut(options), true);
    assert.deepEqual(calls, [['ammo.reloadIfAllEmpty', 2]]);
});

test('does not reload outside active play', async function () {
    const flow = await loadClientAmmoFlow();
    const { calls, options } = createOptions({
        roundState: 'waiting'
    });

    assert.equal(flow.reloadIfBothPlayersAreOut(options), false);
    assert.deepEqual(calls, []);
});

test('does not reload without two clients', async function () {
    const flow = await loadClientAmmoFlow();
    const { calls, options } = createOptions({
        model: {
            clients: [{ id: 'p1' }]
        }
    });

    assert.equal(flow.reloadIfBothPlayersAreOut(options), false);
    assert.deepEqual(calls, []);
});

test('does not reload without a model', async function () {
    const flow = await loadClientAmmoFlow();
    const { calls, options } = createOptions({
        model: null
    });

    assert.equal(flow.reloadIfBothPlayersAreOut(options), false);
    assert.deepEqual(calls, []);
});
