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

async function loadClientAmmoFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientAmmoFlow.ts',
        'flows/clientAmmoFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientAmmoFlow.js')).href
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
        duelState: 'playing'
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
        duelState: 'waiting'
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
