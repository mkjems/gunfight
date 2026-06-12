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

async function loadCanvasTools() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'platform/config.ts',
        'platform/config.js',
        tempDirectory
    );
    compileClientModule(
        'platform/canvasTools.ts',
        'platform/canvasTools.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'platform/canvasTools.js')).href
    );

    return module.CanvasTools;
}

test('disables image smoothing on canvas contexts', async function () {
    const tools = await loadCanvasTools();
    const context = {};

    tools.disableImageSmoothing(context);

    assert.deepEqual(context, {
        imageSmoothingEnabled: false,
        webkitImageSmoothingEnabled: false,
        mozImageSmoothingEnabled: false,
        msImageSmoothingEnabled: false
    });
});

test('creates scaled patterns with smoothing disabled', async function () {
    const tools = await loadCanvasTools();
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
