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

async function loadClientAmmo() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'platform/config.ts',
        'platform/config.js',
        tempDirectory
    );
    compileClientModule(
        'engine/clientAmmo.ts',
        'engine/clientAmmo.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'engine/clientAmmo.js')).href
    );

    return module.ClientAmmo;
}

test('tracks ammo per client', async function () {
    const ClientAmmo = await loadClientAmmo();
    const ammo = new ClientAmmo({ maxAmmo: 2 });

    ammo.reset([{ id: 'p1' }, { id: 'p2' }]);

    assert.equal(ammo.get('p1'), 2);
    assert.equal(ammo.hasAmmo('p1'), true);
    assert.equal(ammo.spend('p1'), true);
    assert.equal(ammo.get('p1'), 1);
    assert.equal(ammo.spend('unknown'), false);
});

test('reloads only when both players are out of ammo', async function () {
    const ClientAmmo = await loadClientAmmo();
    const ammo = new ClientAmmo({ maxAmmo: 1 });
    const clients = [{ id: 'p1' }, { id: 'p2' }];

    ammo.reset(clients);
    ammo.spend('p1');

    assert.equal(ammo.reloadIfAllEmpty(clients), false);
    assert.equal(ammo.get('p1'), 0);
    assert.equal(ammo.get('p2'), 1);

    ammo.spend('p2');

    assert.equal(ammo.reloadIfAllEmpty(clients), true);
    assert.equal(ammo.get('p1'), 1);
    assert.equal(ammo.get('p2'), 1);
});

test('reset clears stale players', async function () {
    const ClientAmmo = await loadClientAmmo();
    const ammo = new ClientAmmo({ maxAmmo: 3 });

    ammo.reset([{ id: 'p1' }]);
    ammo.reset([{ id: 'p2' }]);

    assert.equal(ammo.get('p1'), 0);
    assert.equal(ammo.get('p2'), 3);
});
