import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadCanvasTools() {
    const context = {
        GF: {
            Config: {
                graphics: {
                    scale: 2
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/CanvasTools.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.CanvasTools;
}

test('disables image smoothing on canvas contexts', function () {
    const tools = loadCanvasTools();
    const context = {};

    tools.disableImageSmoothing(context);

    assert.deepEqual(context, {
        imageSmoothingEnabled: false,
        webkitImageSmoothingEnabled: false,
        mozImageSmoothingEnabled: false,
        msImageSmoothingEnabled: false
    });
});

test('creates scaled patterns with smoothing disabled', function () {
    const tools = loadCanvasTools();
    const calls = [];
    const tileContext = {
        drawImage(image, x, y, width, height) {
            calls.push(['drawImage', image.id, x, y, width, height]);
        }
    };
    const tile = {
        getContext(type) {
            calls.push(['getContext', type]);
            return tileContext;
        }
    };
    const document = {
        createElement(tagName) {
            calls.push(['createElement', tagName]);
            return tile;
        }
    };
    const context = {
        createPattern(patternTile, repetition) {
            calls.push(['createPattern', patternTile === tile, repetition]);
            return 'pattern';
        }
    };

    assert.equal(
        tools.createScaledPattern({
            context,
            document,
            image: {
                height: 5,
                id: 'rock',
                width: 10
            }
        }),
        'pattern'
    );

    assert.equal(tile.width, 20);
    assert.equal(tile.height, 10);
    assert.equal(tileContext.imageSmoothingEnabled, false);
    assert.deepEqual(calls, [
        ['createElement', 'canvas'],
        ['getContext', '2d'],
        ['drawImage', 'rock', 0, 0, 20, 10],
        ['createPattern', true, 'repeat']
    ]);
});
