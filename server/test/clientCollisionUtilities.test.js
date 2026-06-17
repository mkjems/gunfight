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

async function loadCollisionUtilities() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'engine/collision.ts',
        'engine/collision.js',
        tempDirectory
    );
    compileClientModule(
        'engine/obstacles.ts',
        'engine/obstacles.js',
        tempDirectory
    );
    compileClientModule('engine/scene.ts', 'engine/scene.js', tempDirectory);

    const [collisionModule, obstaclesModule, sceneModule] = await Promise.all(
        ['engine/collision.js', 'engine/obstacles.js', 'engine/scene.js'].map(
            function (fileName) {
                return import(
                    pathToFileURL(path.join(tempDirectory, fileName)).href
                );
            }
        )
    );

    return {
        Collision: collisionModule.Collision,
        Obstacles: obstaclesModule.Obstacles,
        Scene: sceneModule.Scene
    };
}

test('finds bullet hits and handles ricochet self hits', async function () {
    const { Collision } = await loadCollisionUtilities();
    const players = {
        a: {
            playerId: 'a',
            getHitBox() {
                return { x: 0, y: 0, width: 10, height: 10 };
            }
        },
        b: {
            playerId: 'b',
            getHitBox() {
                return { x: 20, y: 0, width: 10, height: 10 };
            }
        }
    };
    const bullet = {
        hasRicocheted: true,
        ownerId: 'a',
        getHitBox() {
            return { x: 0, y: 0, width: 4, height: 4 };
        }
    };

    assert.deepEqual(Collision.findBulletHit({ shot: bullet }, players), {
        bullet,
        targetId: 'a',
        winnerId: 'b'
    });
});

test('ignores harmless bullets in player hit detection', async function () {
    const { Collision } = await loadCollisionUtilities();
    const players = {
        b: {
            playerId: 'b',
            getHitBox() {
                return { x: 0, y: 0, width: 10, height: 10 };
            }
        }
    };
    const bullet = {
        isHarmful: false,
        ownerId: 'a',
        getHitBox() {
            return { x: 0, y: 0, width: 4, height: 4 };
        }
    };

    assert.equal(Collision.findBulletHit({ shot: bullet }, players), null);
});

test('detects circle collisions with rect, polygon, and circle bodies', async function () {
    const { Obstacles } = await loadCollisionUtilities();

    Obstacles.setBodies([
        { type: 'rect', x: 10, y: 10, width: 20, height: 20 },
        {
            type: 'polygon',
            points: [
                { x: 50, y: 50 },
                { x: 70, y: 50 },
                { x: 60, y: 70 }
            ]
        },
        { type: 'circle', x: 100, y: 100, radius: 10 }
    ]);

    assert.equal(Obstacles.collidesWithAny([{ x: 5, y: 20, radius: 6 }]), true);
    assert.equal(
        Obstacles.collidesWithAny([{ x: 60, y: 55, radius: 2 }]),
        true
    );
    assert.equal(
        Obstacles.collidesWithAny([{ x: 115, y: 100, radius: 6 }]),
        true
    );
    assert.equal(
        Obstacles.collidesWithAny([{ x: 200, y: 200, radius: 5 }]),
        false
    );
});

test('scene moves, prunes, and draws live figures', async function () {
    const { Scene } = await loadCollisionUtilities();
    const scene = new Scene();
    const calls = [];
    const live = {
        draw(context) {
            calls.push(['draw', context]);
        },
        move(lastUpdated, now) {
            calls.push(['move', typeof lastUpdated, typeof now]);
        }
    };
    const deleted = {
        deleteMe: true,
        draw() {
            calls.push('deleted.draw');
        },
        move() {
            calls.push('deleted.move');
        }
    };

    scene.addFigure(live);
    scene.addFigure(deleted);
    scene.moveAll();
    scene.moveAll();
    scene.drawAll('context');

    assert.equal(scene.moveCount, 1);
    assert.equal(scene.figures.length, 1);
    assert.deepEqual(calls, [
        ['move', 'number', 'number'],
        ['draw', 'context']
    ]);
});
