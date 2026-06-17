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

async function loadScenarioRenderer() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'engine/collision.ts',
        'engine/collision.js',
        tempDirectory
    );
    compileClientModule(
        'platform/config.ts',
        'platform/config.js',
        tempDirectory
    );
    compileClientModule(
        'engine/scenarioRenderer.ts',
        'engine/scenarioRenderer.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'engine/scenarioRenderer.js'))
            .href
    );

    return module.ScenarioRenderer;
}

async function createRenderer(options = {}) {
    const ScenarioRenderer = await loadScenarioRenderer();

    return ScenarioRenderer({
        context: createContext(),
        ...options
    });
}

function createContext() {
    return {
        beginPath() {},
        closePath() {},
        drawImage() {},
        fill() {},
        fillRect() {},
        lineTo() {},
        moveTo() {},
        restore() {},
        save() {}
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('builds rock collision lines and obstacle bodies from a scenario', async function () {
    const renderer = await createRenderer({
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

test('renders timed money bag appear animation from scenario seconds', async function () {
    const calls = [];
    const moneySprite = {
        complete: true,
        naturalHeight: 20,
        naturalWidth: 160
    };
    const renderer = await createRenderer({
        context: {
            ...createContext(),
            drawImage(...args) {
                calls.push(args);
            }
        },
        getScenarioStartedAt() {
            return 1000;
        },
        getTime() {
            return 3500;
        },
        sprites: {
            money: moneySprite
        }
    });

    renderer.render({
        moneyBags: [
            { x: 100, y: 200, gameRoundSeconds: 1 },
            { x: 300, y: 200, gameRoundSeconds: 5 }
        ]
    });

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], [moneySprite, 140, 0, 20, 20, 80, 160, 40, 40]);
});

test('finds bullet hits against damageable obstacles', async function () {
    const renderer = await createRenderer();
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

test('ignores harmless bullets against damageable obstacles', async function () {
    const renderer = await createRenderer();
    const bullet = {
        deleteMe: false,
        isHarmful: false,
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

    assert.equal(renderer.findBulletObstacleHit({ a: bullet }, scenario), null);
});
