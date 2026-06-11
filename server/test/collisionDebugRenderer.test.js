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

async function loadCollisionDebugRenderer() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('config.ts', 'config.js', tempDirectory);
    compileClientModule(
        'collisionDebugRenderer.ts',
        'collisionDebugRenderer.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'collisionDebugRenderer.js'))
            .href
    );

    return module.CollisionDebugRenderer;
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
        beginPath() {
            calls.push(['beginPath']);
        },
        moveTo(x, y) {
            calls.push(['moveTo', x, y]);
        },
        lineTo(x, y) {
            calls.push(['lineTo', x, y]);
        },
        closePath() {
            calls.push(['closePath']);
        },
        stroke() {
            calls.push(['stroke']);
        },
        strokeRect(x, y, width, height) {
            calls.push(['strokeRect', x, y, width, height]);
        },
        arc(x, y, radius, start, end) {
            calls.push(['arc', x, y, radius, start, end]);
        }
    };
}

test('draws obstacle and player collision bodies when debug is enabled', async function () {
    const CollisionDebugRenderer = await loadCollisionDebugRenderer();
    const context = createContext();
    const renderer = new CollisionDebugRenderer(context, {
        showCollisionBodies: true
    });

    renderer.render({
        obstacleBodies: [
            { type: 'rect', x: 1, y: 2, width: 3, height: 4 },
            {
                type: 'polygon',
                points: [
                    { x: 10, y: 20 },
                    { x: 30, y: 40 }
                ]
            },
            { type: 'circle', x: 5, y: 6, radius: 7 }
        ],
        players: {
            p1: {
                getCollisionCircles() {
                    return [{ x: 8, y: 9, radius: 10 }];
                }
            }
        }
    });

    assert.deepEqual(context.calls, [
        ['save'],
        ['strokeRect', 1, 2, 3, 4],
        ['beginPath'],
        ['moveTo', 10, 20],
        ['lineTo', 30, 40],
        ['closePath'],
        ['stroke'],
        ['beginPath'],
        ['arc', 5, 6, 7, 0, Math.PI * 2],
        ['stroke'],
        ['restore'],
        ['save'],
        ['beginPath'],
        ['arc', 8, 9, 10, 0, Math.PI * 2],
        ['stroke'],
        ['restore']
    ]);
});

test('skips drawing when collision debug is disabled', async function () {
    const CollisionDebugRenderer = await loadCollisionDebugRenderer();
    const context = createContext();
    const renderer = new CollisionDebugRenderer(context, {
        showCollisionBodies: false
    });

    renderer.render({
        obstacleBodies: [{ type: 'rect', x: 1, y: 2, width: 3, height: 4 }],
        players: {}
    });

    assert.deepEqual(context.calls, []);
});
