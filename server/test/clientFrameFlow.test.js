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

async function loadClientFrameFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientFrameFlow.ts',
        'flows/clientFrameFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientFrameFlow.js')).href
    );

    return module.ClientFrameFlow;
}

function createUpdateOptions() {
    const calls = [];

    return {
        calls,
        options: {
            checkForHits() {
                calls.push('checkForHits');
            },
            roundIntro: {
                update() {
                    calls.push('roundIntro.update');
                }
            },
            scene: {
                moveAll() {
                    calls.push('scene.moveAll');
                }
            },
            syncLocalPlayerPosition() {
                calls.push('syncLocalPlayerPosition');
            },
            updateBulletCollisionEnvironment() {
                calls.push('updateBulletCollisionEnvironment');
            },
            updateCamera() {
                calls.push('updateCamera');
            },
            updateMovementObstacleEnvironment() {
                calls.push('updateMovementObstacleEnvironment');
            }
        }
    };
}

function createRenderOptions(overrides = {}) {
    const calls = [];
    const options = {
        camera: {
            apply() {
                calls.push('camera.apply');
            }
        },
        canvas: {
            height: 200,
            width: 300
        },
        context: {
            clearRect(x, y, width, height) {
                calls.push(['context.clearRect', x, y, width, height]);
            },
            restore() {
                calls.push('context.restore');
            },
            save() {
                calls.push('context.save');
            }
        },
        drawCollisionBodies() {
            calls.push('drawCollisionBodies');
        },
        drawScenario() {
            calls.push('drawScenario');
        },
        renderHud() {
            calls.push('renderHud');
        },
        roundState: 'playing',
        scene: {
            drawAll() {
                calls.push('scene.drawAll');
            }
        },
        shouldUseCamera() {
            return true;
        },
        updateTouchControls() {
            calls.push('updateTouchControls');
        }
    };

    return {
        calls,
        options: {
            ...options,
            ...overrides
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('updates one frame in simulation order', async function () {
    const frameFlow = await loadClientFrameFlow();
    const { calls, options } = createUpdateOptions();

    frameFlow.update(options);

    assert.deepEqual(calls, [
        'updateBulletCollisionEnvironment',
        'updateMovementObstacleEnvironment',
        'scene.moveAll',
        'roundIntro.update',
        'syncLocalPlayerPosition',
        'checkForHits',
        'updateCamera'
    ]);
});

test('renders one gameplay frame with camera and scenario', async function () {
    const frameFlow = await loadClientFrameFlow();
    const { calls, options } = createRenderOptions();

    frameFlow.render(options);

    assert.deepEqual(plain(calls), [
        ['context.clearRect', 0, 0, 300, 200],
        'context.save',
        'camera.apply',
        'drawScenario',
        'scene.drawAll',
        'drawCollisionBodies',
        'context.restore',
        'renderHud',
        'updateTouchControls'
    ]);
});

test('renders waiting frame without camera or scenario', async function () {
    const frameFlow = await loadClientFrameFlow();
    const { calls, options } = createRenderOptions({
        roundState: 'waiting',
        shouldUseCamera() {
            return false;
        }
    });

    frameFlow.render(options);

    assert.deepEqual(plain(calls), [
        ['context.clearRect', 0, 0, 300, 200],
        'context.save',
        'scene.drawAll',
        'drawCollisionBodies',
        'context.restore',
        'renderHud',
        'updateTouchControls'
    ]);
});
