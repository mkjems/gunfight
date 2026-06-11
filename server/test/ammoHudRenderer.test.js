import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    writeFileSync(
        path.join(tempDirectory, outputName),
        transpiled.outputText,
        'utf8'
    );
}

async function loadAmmoHudRenderer() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('config.ts', 'config.js', tempDirectory);
    compileClientModule(
        'ammoHudRenderer.ts',
        'ammoHudRenderer.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'ammoHudRenderer.js')).href
    );

    return module.AmmoHudRenderer;
}

function createContext() {
    const calls = [];

    return {
        calls,
        save() {
            calls.push(['save']);
        },
        restore() {
            calls.push(['restore']);
        },
        drawImage(sprite, x, y, width, height) {
            calls.push(['drawImage', sprite.id, x, y, width, height]);
        },
        fillRect(x, y, width, height) {
            calls.push(['fillRect', x, y, width, height]);
        }
    };
}

test('draws ammo with the sprite when it is loaded', async function () {
    const AmmoHudRenderer = await loadAmmoHudRenderer();
    const context = createContext();
    const renderer = new AmmoHudRenderer({
        context,
        sprite: {
            complete: true,
            id: 'bullet'
        }
    });

    renderer.render(2, 100, 200, 1);

    assert.deepEqual(context.calls, [
        ['save'],
        ['drawImage', 'bullet', 100, 200, 14, 32],
        ['drawImage', 'bullet', 120, 200, 14, 32],
        ['restore']
    ]);
});

test('draws fallback rectangles when the sprite is not loaded', async function () {
    const AmmoHudRenderer = await loadAmmoHudRenderer();
    const context = createContext();
    const renderer = new AmmoHudRenderer({
        context,
        sprite: {
            complete: false
        }
    });

    renderer.render(2, 100, 200, -1);

    assert.deepEqual(context.calls, [
        ['save'],
        ['fillRect', 100, 200, 14, 32],
        ['fillRect', 80, 200, 14, 32],
        ['restore']
    ]);
});
