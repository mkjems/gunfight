import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientCollisionEnvironment() {
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
        new URL(
            '../../client/js/ClientCollisionEnvironment.js',
            import.meta.url
        ),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientCollisionEnvironment;
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

test('updates bullet collision lines from the current scenario', function () {
    const environment = loadClientCollisionEnvironment();
    const { calls, options } = createOptions();

    environment.updateBulletLines(options);

    assert.deepEqual(plain(calls), [
        ['scenarioRenderer.getRockLines', 'scenario-1'],
        ['Bullet.setCollisionLines', ['line']]
    ]);
});

test('updates obstacle bodies from the current scenario during play', function () {
    const environment = loadClientCollisionEnvironment();
    const { calls, options } = createOptions();

    environment.updateObstacleBodies(options);

    assert.deepEqual(plain(calls), [
        ['scenarioRenderer.getObstacleBodies', 'scenario-1'],
        ['Obstacles.setBodies', ['body']]
    ]);
});

test('clears obstacle bodies while waiting', function () {
    const environment = loadClientCollisionEnvironment();
    const { calls, options } = createOptions({
        roundState: 'waiting'
    });

    environment.updateObstacleBodies(options);

    assert.deepEqual(plain(calls), [
        ['scenarioRenderer.getObstacleBodies', null],
        ['Obstacles.setBodies', ['body']]
    ]);
});
