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

async function loadParticleLayer() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'platform/config.ts',
        'platform/config.js',
        tempDirectory
    );
    compileClientModule(
        'engine/particleLayer.ts',
        'engine/particleLayer.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'engine/particleLayer.js')).href
    );

    return module.ParticleLayer;
}

test('particle layer spawns and clears pixel effects', async function () {
    const ParticleLayer = await loadParticleLayer();
    const layer = new ParticleLayer({
        random() {
            return 0.5;
        }
    });

    layer.spawnMuzzleFlash({
        facing: 1,
        x: 100,
        y: 200
    });
    layer.spawnGunSmoke({
        facing: 1,
        x: 100,
        y: 200
    });

    assert.equal(layer.count(), 9);

    layer.clear();

    assert.equal(layer.count(), 0);
});

test('particle layer expires particles by lifetime', async function () {
    const ParticleLayer = await loadParticleLayer();
    const layer = new ParticleLayer({
        random() {
            return 0.5;
        }
    });

    layer.spawnRicochetSparks({
        speedX: 100,
        speedY: 0,
        x: 50,
        y: 60
    });

    assert.equal(layer.count(), 5);

    layer.update(0.1);

    assert.equal(layer.count(), 5);

    layer.update(0.08);
    layer.update(0.08);

    assert.equal(layer.count(), 0);
});

test('particle layer caps particle count', async function () {
    const ParticleLayer = await loadParticleLayer();
    const layer = new ParticleLayer({
        maxParticles: 5,
        random() {
            return 0.5;
        }
    });

    layer.spawnPlayerHit({
        speedX: 100,
        speedY: 0,
        x: 50,
        y: 60
    });

    assert.equal(layer.count(), 5);
});

test('particle layer renders hard square pixels', async function () {
    const ParticleLayer = await loadParticleLayer();
    const layer = new ParticleLayer({
        random() {
            return 0.5;
        }
    });
    const calls = [];
    const context = {
        fillStyle: '',
        fillRect(x, y, width, height) {
            calls.push([this.fillStyle, x, y, width, height]);
        }
    };

    layer.spawnRockChips({
        speedX: 100,
        speedY: 0,
        x: 50,
        y: 60
    });
    layer.render(context);

    assert.equal(calls.length, 6);
    calls.forEach(function (call) {
        assert.equal(call[0], 'rgb(255,244,0)');
        assert.equal(Number.isInteger(call[1]), true);
        assert.equal(Number.isInteger(call[2]), true);
        assert.equal(call[3], 3);
        assert.equal(call[3], call[4]);
        assert.equal(call[1] % 2, 0);
        assert.equal(call[2] % 2, 0);
    });
});

test('zero-jitter bursts start on the source pixel grid', async function () {
    const ParticleLayer = await loadParticleLayer();
    const layer = new ParticleLayer({
        random() {
            return 1;
        }
    });
    const calls = [];
    const context = {
        fillStyle: '',
        fillRect(x, y, width, height) {
            calls.push([x, y, width, height]);
        }
    };

    layer.spawnMuzzleFlash({
        facing: 1,
        x: 101,
        y: 199
    });
    layer.render(context);

    assert.equal(calls.length, 6);
    calls.forEach(function (call) {
        assert.equal(call[0], 102);
        assert.equal(call[1], 200);
        assert.equal(call[2], 3);
        assert.equal(call[2], call[3]);
    });
});
