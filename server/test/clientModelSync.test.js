import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientModelSync() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientModelSync.ts'),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });
    const encoded = Buffer.from(transpiled.outputText).toString('base64');
    const module = await import('data:text/javascript;base64,' + encoded);

    return module.ClientModelSync;
}

test('finds the local client in the public game model', async function () {
    const sync = await loadClientModelSync();
    const model = {
        clients: [
            { id: 1, name: 'ACE', ready: false, slot: 0 },
            { id: 2, name: 'KID', ready: true, slot: 1 }
        ]
    };

    assert.equal(sync.getLocalClient(model, 2).name, 'KID');
    assert.equal(sync.getLocalClient(model, 3), null);
});

test('analyzes model changes for client synchronization', async function () {
    const sync = await loadClientModelSync();
    const previousModel = {
        status: 'readying',
        clients: [
            { id: 1, ready: false },
            { id: 2, ready: false }
        ]
    };
    const model = {
        status: 'playing',
        clients: [
            { id: 1, ready: true },
            { id: 2, ready: true }
        ]
    };

    const result = sync.analyze(previousModel, model, 1);

    assert.equal(result.abandoned, false);
    assert.equal(result.clearLocalReadyRequest, false);
    assert.equal(result.clientBecameReady, true);
    assert.equal(result.readyToStart, true);
});

test('detects abandoned games and cleared local ready state', async function () {
    const sync = await loadClientModelSync();
    const model = {
        status: 'abandoned',
        clients: [{ id: 1, ready: false }]
    };

    const result = sync.analyze(null, model, 1);

    assert.equal(result.abandoned, true);
    assert.equal(result.clearLocalReadyRequest, true);
    assert.equal(result.clientBecameReady, false);
    assert.equal(result.readyToStart, false);
});
