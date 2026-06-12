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

async function loadDrawingUtilities() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'platform/color.ts',
        'platform/color.js',
        tempDirectory
    );
    compileClientModule('platform/pen.ts', 'platform/pen.js', tempDirectory);
    compileClientModule(
        'platform/requestAnimationFrame.ts',
        'platform/requestAnimationFrame.js',
        tempDirectory
    );

    const [colorModule, penModule, animationModule] = await Promise.all(
        [
            'platform/color.js',
            'platform/pen.js',
            'platform/requestAnimationFrame.js'
        ].map(function (fileName) {
            return import(
                pathToFileURL(path.join(tempDirectory, fileName)).href
            );
        })
    );

    return {
        Color: colorModule.Color,
        Pen: penModule.Pen,
        createRequestAnimFrame: animationModule.createRequestAnimFrame
    };
}

test('formats colors as canvas rgb strings', async function () {
    const { Color } = await loadDrawingUtilities();
    const color = new Color(1, 2, 3);

    assert.equal(color.cssString(), 'rgb(1,2,3)');
});

test('draws pens with their current color', async function () {
    const { Color, Pen } = await loadDrawingUtilities();
    const color = new Color(10, 20, 30);
    const pen = new Pen(12, 18, color);
    const calls = [];
    const context = {
        fillStyle: '',
        beginPath() {
            calls.push(['beginPath']);
        },
        rect(x, y, width, height) {
            calls.push(['rect', x, y, width, height]);
        },
        fill() {
            calls.push(['fill', this.fillStyle]);
        }
    };

    pen.draw(context);

    assert.deepEqual(calls, [
        ['beginPath'],
        ['rect', 12, 18, 5, 5],
        ['fill', 'rgb(10,20,30)']
    ]);
});

test('uses browser animation frames before timeout fallback', async function () {
    const { createRequestAnimFrame } = await loadDrawingUtilities();
    const calls = [];
    const requestAnimFrame = createRequestAnimFrame({
        requestAnimationFrame(callback) {
            calls.push('requestAnimationFrame');
            callback();
        },
        setTimeout() {
            calls.push('setTimeout');
        }
    });

    requestAnimFrame(function () {
        calls.push('callback');
    });

    assert.deepEqual(calls, ['requestAnimationFrame', 'callback']);
});

test('falls back to a 60fps timeout when animation frames are unavailable', async function () {
    const { createRequestAnimFrame } = await loadDrawingUtilities();
    const calls = [];
    const requestAnimFrame = createRequestAnimFrame({
        setTimeout(callback, delay) {
            calls.push(['setTimeout', delay]);
            callback();
        }
    });

    requestAnimFrame(function () {
        calls.push('callback');
    });

    assert.deepEqual(calls, [['setTimeout', 1000 / 60], 'callback']);
});
