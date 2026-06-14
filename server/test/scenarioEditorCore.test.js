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

async function loadScenarioEditorCore() {
    const tempDirectory = mkdtempSync(
        path.join(tmpdir(), 'gunfight-scenario-')
    );

    compileModule('shared/contracts.ts', 'shared/contracts.js', tempDirectory);
    compileModule(
        'client/src/tools/scenarioEditorCore.ts',
        'client/src/tools/scenarioEditorCore.js',
        tempDirectory
    );

    try {
        return await import(
            pathToFileURL(
                path.join(
                    tempDirectory,
                    'client/src/tools/scenarioEditorCore.js'
                )
            ).href
        );
    } finally {
        rmSync(tempDirectory, { force: true, recursive: true });
    }
}

const rockDefinitions = {
    small: {
        lines: [
            { from: [0, 0], to: [20, 0] },
            { from: [20, 0], to: [20, 20] },
            { from: [20, 20], to: [0, 0] }
        ]
    }
};

test('parses, validates, and formats scenario JSON', async function () {
    const {
        ensureScenarioPlayerStarts,
        formatScenarioSources,
        parseScenarioEditorJson,
        validateScenarioSources
    } = await loadScenarioEditorCore();
    const scenarios = parseScenarioEditorJson(
        JSON.stringify([
            {
                name: 'test',
                decorations: [{ type: 'saloon', x: 0, y: 220 }],
                cacti: [{ x: 475, y: 378 }],
                rocks: [{ type: 'small', x: 475, y: 445 }]
            }
        ]),
        rockDefinitions
    );

    assert.equal(scenarios[0].name, 'test');
    assert.deepEqual(validateScenarioSources(scenarios, rockDefinitions), []);
    assert.deepEqual(ensureScenarioPlayerStarts(scenarios)[0].playerStarts, [
        { x: 150, y: 430, facing: 1, frame: 0 },
        { x: 800, y: 430, facing: -1, frame: 2 }
    ]);
    assert.match(formatScenarioSources(scenarios), /"name": "test"/);
});

test('updates scenario objects and produces readable validation errors', async function () {
    const {
        addScenarioObject,
        getScenarioObject,
        removeScenarioObject,
        updateScenarioObjectFields,
        updateScenarioObjectPosition,
        validateScenarioSources
    } = await loadScenarioEditorCore();
    let scenarios = [{ name: 'test', rocks: [] }];
    const added = addScenarioObject(
        scenarios,
        0,
        'rock',
        { x: 475, y: 445 },
        { rockType: 'small' }
    );

    scenarios = updateScenarioObjectPosition(added.scenarios, 0, added.ref, {
        x: 500.333,
        y: 460.555
    });
    assert.deepEqual(getScenarioObject(scenarios[0], added.ref), {
        type: 'small',
        x: 500.33,
        y: 460.56
    });

    scenarios = updateScenarioObjectFields(scenarios, 0, added.ref, {
        type: 'missing',
        x: 2000,
        y: 460
    });
    assert.match(
        validateScenarioSources(scenarios, rockDefinitions).join('\n'),
        /unknown rock type|outside the arena/
    );

    scenarios = removeScenarioObject(scenarios, 0, added.ref);
    assert.deepEqual(scenarios[0].rocks, []);
});
