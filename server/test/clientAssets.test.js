import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientAssets() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientAssets.ts'),
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

    return module.ClientAssets;
}

function createImageConstructor(images) {
    return function Image() {
        const image = {};
        images.push(image);
        return image;
    };
}

test('loads client image assets with expected sources', async function () {
    const ClientAssets = await loadClientAssets();
    const images = [];
    let ammoLoaded = false;
    const assets = new ClientAssets({
        Image: createImageConstructor(images),
        createRockPattern() {
            return 'pattern';
        },
        onAmmoLoaded() {
            ammoLoaded = true;
        }
    });

    assets.load();
    assets.sprites.ammo.onload();

    assert.equal(ammoLoaded, true);
    assert.equal(assets.sprites.ammo.src, 'images/bullet.png');
    assert.equal(assets.sprites.wagon.src, 'images/wagon-1-4-37x38.png');
    assert.equal(assets.sprites.cactus.src, 'images/cactus-1-4-17X32.png');
    assert.equal(assets.sprites.saloon.src, 'images/saloon-64x128.png');
    assert.equal(assets.sprites.rockPattern.src, 'images/rock-pattern.png');
});

test('creates and stores the rock pattern when its image loads', async function () {
    const ClientAssets = await loadClientAssets();
    const images = [];
    let notifiedPattern = null;
    const assets = new ClientAssets({
        Image: createImageConstructor(images),
        createRockPattern(image) {
            assert.equal(image, assets.sprites.rockPattern);
            return 'pattern';
        },
        onRockPatternLoaded(pattern) {
            notifiedPattern = pattern;
        }
    });

    assets.load();
    assets.sprites.rockPattern.onload();

    assert.equal(assets.getRockPattern(), 'pattern');
    assert.equal(notifiedPattern, 'pattern');
});
