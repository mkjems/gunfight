import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadScenarioRenderer() {
    const context = {
        GF: {
            Collision: {
                boxesOverlap(a, b) {
                    return (
                        a.x < b.x + b.width &&
                        a.x + a.width > b.x &&
                        a.y < b.y + b.height &&
                        a.y + a.height > b.y
                    );
                }
            },
            Config: {
                colors: {
                    yellow: 'yellow'
                },
                graphics: {
                    scale: 2
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ScenarioRenderer.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ScenarioRenderer;
}

function createRenderer(options = {}) {
    const ScenarioRenderer = loadScenarioRenderer();

    return new ScenarioRenderer({
        context: {},
        ...options
    });
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('builds rock collision lines and obstacle bodies from a scenario', function () {
    const renderer = createRenderer({
        getObstacleDamage(id) {
            return id === 'cactus:0' ? 1 : 0;
        },
        getScenarioStartedAt() {
            return 1000;
        },
        getTime() {
            return 1500;
        }
    });
    const scenario = {
        cacti: [{ x: 20, y: 80 }],
        rocks: [
            {
                x: 100,
                y: 200,
                lines: [
                    { from: [0, 0], to: [10, 0] },
                    { from: [10, 0], to: [10, 10] }
                ]
            }
        ],
        wagon: {
            x: 300,
            fromY: 100,
            toY: 200,
            duration: 1000
        }
    };

    assert.deepEqual(plain(renderer.getRockLines(scenario)), [
        { x1: 100, y1: 200, x2: 110, y2: 200 },
        { x1: 110, y1: 200, x2: 110, y2: 210 }
    ]);

    assert.deepEqual(plain(renderer.getObstacleBodies(scenario)), [
        {
            type: 'rect',
            id: 'cactus:0',
            damage: 1,
            x: 15,
            y: 36,
            width: 10,
            height: 44
        },
        {
            type: 'polygon',
            points: [
                { x: 100, y: 200 },
                { x: 110, y: 200 }
            ]
        },
        {
            type: 'circle',
            id: 'wagon',
            damage: 0,
            x: 286,
            y: 164,
            radius: 18
        },
        {
            type: 'circle',
            id: 'wagon',
            damage: 0,
            x: 314,
            y: 164,
            radius: 18
        },
        {
            type: 'circle',
            id: 'wagon',
            damage: 0,
            x: 300,
            y: 130,
            radius: 20
        }
    ]);
});

test('finds bullet hits against damageable obstacles', function () {
    const renderer = createRenderer();
    const bullet = {
        deleteMe: false,
        getHitBox() {
            return {
                x: 15,
                y: 20,
                width: 4,
                height: 4
            };
        }
    };
    const scenario = {
        cacti: [{ x: 20, y: 80 }]
    };

    const hit = renderer.findBulletObstacleHit({ a: bullet }, scenario);

    assert.equal(hit.bullet, bullet);
    assert.equal(hit.obstacleId, 'cactus:0');
});
