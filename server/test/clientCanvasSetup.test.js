import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientCanvasSetup() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientCanvasSetup.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientCanvasSetup;
}

function createDocument() {
    const contexts = {
        canvas: {
            id: 'canvas-context'
        },
        hudCanvas: {
            id: 'hud-context'
        }
    };
    const elements = {
        canvas: {
            getContext() {
                return contexts.canvas;
            }
        },
        hudCanvas: {
            getContext() {
                return contexts.hudCanvas;
            }
        }
    };

    return {
        contexts: contexts,
        document: {
            getElementById(id) {
                return elements[id];
            }
        },
        elements: elements
    };
}

test('creates sized canvas surfaces with image smoothing disabled', function () {
    const setup = loadClientCanvasSetup();
    const { contexts, document, elements } = createDocument();
    const disabled = [];

    const surfaces = setup.create({
        CanvasTools: {
            disableImageSmoothing(context) {
                disabled.push(context.id);
            }
        },
        canvasConfig: {
            height: 720,
            width: 960
        },
        document: document
    });

    assert.equal(surfaces.canvas, elements.canvas);
    assert.equal(surfaces.context, contexts.canvas);
    assert.equal(surfaces.hudCanvas, elements.hudCanvas);
    assert.equal(surfaces.hudContext, contexts.hudCanvas);
    assert.equal(elements.canvas.width, 960);
    assert.equal(elements.canvas.height, 720);
    assert.equal(elements.hudCanvas.width, 960);
    assert.equal(elements.hudCanvas.height, 720);
    assert.deepEqual(disabled, ['canvas-context', 'hud-context']);
});
