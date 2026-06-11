import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientFrameFlow() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    PLAYING: 'playing',
                    WAITING: 'waiting'
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientFrameFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientFrameFlow;
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

test('updates one frame in simulation order', function () {
    const frameFlow = loadClientFrameFlow();
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

test('renders one gameplay frame with camera and scenario', function () {
    const frameFlow = loadClientFrameFlow();
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

test('renders waiting frame without camera or scenario', function () {
    const frameFlow = loadClientFrameFlow();
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
