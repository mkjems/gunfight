import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientAssets() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientAssets.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientAssets;
}

function createImageConstructor(images) {
    return function Image() {
        const image = {};
        images.push(image);
        return image;
    };
}

test('loads client image assets with expected sources', function () {
    const ClientAssets = loadClientAssets();
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

test('creates and stores the rock pattern when its image loads', function () {
    const ClientAssets = loadClientAssets();
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
