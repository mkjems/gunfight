import assert from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileModule(sourcePath, outputPath, tempDirectory) {
    const source = readFileSync(path.join(process.cwd(), sourcePath), 'utf8');
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        },
        fileName: sourcePath
    });
    const fullOutputPath = path.join(tempDirectory, outputPath);

    mkdirSync(path.dirname(fullOutputPath), { recursive: true });
    writeFileSync(fullOutputPath, transpiled.outputText, 'utf8');
}

async function loadRockEditorCore() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-rock-'));

    compileModule('shared/contracts.ts', 'shared/contracts.js', tempDirectory);
    compileModule(
        'client/src/tools/rockEditorCore.ts',
        'client/src/tools/rockEditorCore.js',
        tempDirectory
    );

    try {
        return await import(
            pathToFileURL(
                path.join(tempDirectory, 'client/src/tools/rockEditorCore.js')
            ).href
        );
    } finally {
        rmSync(tempDirectory, { force: true, recursive: true });
    }
}

test('parses rock collections and single rock definitions', async function () {
    const { parseRockEditorJson } = await loadRockEditorCore();
    const collection = parseRockEditorJson(
        JSON.stringify({
            small: {
                lines: [
                    { from: [0, 0], to: [10, 0] },
                    { from: [10, 0], to: [10, 10] },
                    { from: [10, 10], to: [0, 0] }
                ]
            }
        })
    );
    const single = parseRockEditorJson(
        JSON.stringify({
            lines: [
                { from: [0, 0], to: [8, 0] },
                { from: [8, 0], to: [0, 8] },
                { from: [0, 8], to: [0, 0] }
            ]
        }),
        'new-rock'
    );

    assert.equal(collection.selectedType, 'small');
    assert.deepEqual(Object.keys(single.definitions), ['new-rock']);
});

test('validates rock polygon geometry with readable messages', async function () {
    const { validateRockDefinition } = await loadRockEditorCore();
    const valid = validateRockDefinition({
        lines: [
            { from: [0, 0], to: [20, 0] },
            { from: [20, 0], to: [20, 10] },
            { from: [20, 10], to: [0, 10] },
            { from: [0, 10], to: [0, 0] }
        ]
    });
    const crossing = validateRockDefinition({
        lines: [
            { from: [0, 0], to: [20, 20] },
            { from: [20, 20], to: [0, 20] },
            { from: [0, 20], to: [20, 0] },
            { from: [20, 0], to: [0, 0] }
        ]
    });
    const open = validateRockDefinition({
        lines: [
            { from: [0, 0], to: [20, 0] },
            { from: [25, 0], to: [0, 20] },
            { from: [0, 20], to: [0, 0] }
        ]
    });

    assert.equal(valid.valid, true);
    assert.deepEqual(valid.bounds, {
        height: 10,
        maxX: 20,
        maxY: 10,
        minX: 0,
        minY: 0,
        width: 20
    });
    assert.equal(crossing.valid, false);
    assert.match(crossing.errors.join('\n'), /cross/);
    assert.equal(open.valid, false);
    assert.match(open.errors.join('\n'), /must end where line/);
});

test('updates points, inserted points, removed points, and dimensions', async function () {
    const {
        definitionToPoints,
        insertPointAfter,
        removePointAt,
        scaleRockDefinition,
        updateRockPoint
    } = await loadRockEditorCore();
    const rock = {
        lines: [
            { from: [0, 0], to: [10, 0] },
            { from: [10, 0], to: [10, 10] },
            { from: [10, 10], to: [0, 0] }
        ]
    };
    const moved = updateRockPoint(rock, 1, { x: 12.345, y: 1.234 });
    const inserted = insertPointAfter(rock, 0);
    const removed = removePointAt(inserted, 1);
    const scaled = scaleRockDefinition(rock, 20, 30);

    assert.deepEqual(definitionToPoints(moved)[1], { x: 12.35, y: 1.23 });
    assert.deepEqual(definitionToPoints(inserted), [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 }
    ]);
    assert.deepEqual(removed, rock);
    assert.deepEqual(definitionToPoints(scaled), [
        { x: -5, y: -10 },
        { x: 15, y: -10 },
        { x: 15, y: 20 }
    ]);
});
