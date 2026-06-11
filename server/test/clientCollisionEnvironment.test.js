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

async function loadClientCollisionEnvironment() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientCollisionEnvironment.ts',
        'clientCollisionEnvironment.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientCollisionEnvironment.js'))
            .href
    );

    return module.ClientCollisionEnvironment;
}

function createOptions(overrides = {}) {
    const calls = [];
    const scenario = {
        id: 'scenario-1'
    };
    const options = {
        Bullet: {
            setCollisionLines(lines) {
                calls.push(['Bullet.setCollisionLines', lines]);
            }
        },
        Obstacles: {
            setBodies(bodies) {
                calls.push(['Obstacles.setBodies', bodies]);
            }
        },
        roundState: 'playing',
        scenario: scenario,
        scenarioRenderer: {
            getObstacleBodies(nextScenario) {
                calls.push([
                    'scenarioRenderer.getObstacleBodies',
                    nextScenario && nextScenario.id
                ]);

                return ['body'];
            },
            getRockLines(nextScenario) {
                calls.push([
                    'scenarioRenderer.getRockLines',
                    nextScenario && nextScenario.id
                ]);

                return ['line'];
            }
        },
        ...overrides
    };

    return {
        calls,
        options: options
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('updates bullet collision lines from the current scenario', async function () {
    const environment = await loadClientCollisionEnvironment();
    const { calls, options } = createOptions();

    environment.updateBulletLines(options);

    assert.deepEqual(plain(calls), [
        ['scenarioRenderer.getRockLines', 'scenario-1'],
        ['Bullet.setCollisionLines', ['line']]
    ]);
});

test('updates obstacle bodies from the current scenario during play', async function () {
    const environment = await loadClientCollisionEnvironment();
    const { calls, options } = createOptions();

    environment.updateObstacleBodies(options);

    assert.deepEqual(plain(calls), [
        ['scenarioRenderer.getObstacleBodies', 'scenario-1'],
        ['Obstacles.setBodies', ['body']]
    ]);
});

test('clears obstacle bodies while waiting', async function () {
    const environment = await loadClientCollisionEnvironment();
    const { calls, options } = createOptions({
        roundState: 'waiting'
    });

    environment.updateObstacleBodies(options);

    assert.deepEqual(plain(calls), [
        ['scenarioRenderer.getObstacleBodies', null],
        ['Obstacles.setBodies', ['body']]
    ]);
});
