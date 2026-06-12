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

async function loadGameplayConstructors() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    [
        'platform/config.ts',
        'platform/color.ts',
        'platform/pen.ts',
        'engine/obstacles.ts',
        'engine/bullet.ts',
        'engine/bullets.ts',
        'engine/controllable.ts',
        'engine/players.ts'
    ].forEach(function (sourceName) {
        compileClientModule(
            sourceName,
            sourceName.replace(/\.ts$/, '.js'),
            tempDirectory
        );
    });

    const [bulletModule, bulletsModule, controllableModule, playersModule] =
        await Promise.all(
            [
                'engine/bullet.js',
                'engine/bullets.js',
                'engine/controllable.js',
                'engine/players.js'
            ].map(function (fileName) {
                return import(
                    pathToFileURL(path.join(tempDirectory, fileName)).href
                );
            })
        );

    return {
        Bullet: bulletModule.Bullet,
        Bullets: bulletsModule.Bullets,
        Controllable: controllableModule.Controllable,
        Players: playersModule.Players
    };
}

test('bullets fire once per owner and expose snapshots', async function () {
    const { Bullets } = await loadGameplayConstructors();
    const figures = [];
    const bullets = new Bullets({
        addFigure(figure) {
            figures.push(figure);
        }
    });
    const player = {
        aim: 4,
        facing: 1,
        playerId: 'p1',
        x: 100,
        y: 200
    };

    const bullet = bullets.fire(player);

    assert.equal(figures[0], bullet);
    assert.equal(bullets.fire(player), false);
    assert.deepEqual(Object.keys(bullets.all()), ['p1']);
    assert.equal(typeof bullet.toSnapshot().speedX, 'number');

    bullets.remove('p1');

    assert.equal(bullet.deleteMe, true);
    assert.deepEqual(bullets.all(), {});
});

test('bullets replace deleted shots and clear active scene figures', async function () {
    const { Bullets } = await loadGameplayConstructors();
    const figures = [];
    const bullets = new Bullets({
        addFigure(figure) {
            figures.push(figure);
        }
    });
    const player = {
        aim: 4,
        facing: 1,
        playerId: 'p1',
        x: 100,
        y: 200
    };
    const firstBullet = bullets.fire(player);

    firstBullet.deleteMe = true;

    const replacementBullet = bullets.fire(player);

    assert.notEqual(replacementBullet, firstBullet);
    assert.equal(bullets.all().p1, replacementBullet);
    assert.deepEqual(figures, [firstBullet, replacementBullet]);

    bullets.clear();

    assert.equal(replacementBullet.deleteMe, true);
    assert.deepEqual(bullets.all(), {});
});

test('bullet collision lines reflect ricochets', async function () {
    const { Bullet } = await loadGameplayConstructors();
    const ricochets = [];
    const bullet = new Bullet(
        {
            facing: 1,
            playerId: 'p1',
            x: 100,
            y: 100
        },
        {
            speedX: 0,
            speedY: -120,
            x: 100,
            y: 10
        }
    );

    Bullet.onRicochet = function (nextBullet) {
        ricochets.push(nextBullet);
    };
    Bullet.setCollisionLines([]);
    bullet.moveStep(1 / 10);

    assert.equal(bullet.hasRicocheted, true);
    assert.equal(bullet.speedY, 120);
    assert.equal(ricochets[0], bullet);
});

test('controllable moves, aims, and exposes collision geometry', async function () {
    const { Controllable } = await loadGameplayConstructors();
    const player = new Controllable(150, 430, {
        playerId: 'p1',
        speed: 100
    });

    player.respondToKeyEvent({ action: 'down', key: 'l' });
    player.respondToKeyEvent({ action: 'down', key: 'a' });
    player.move(0, 1000);

    assert.equal(player.getAim(), 5);
    assert.equal(player.x, 250);
    assert.equal(player.y, 430);
    assert.equal(player.getCollisionCircles().length > 0, true);

    player.playDeathAnimation();
    player.move(1000, 1200);

    assert.equal(player.isDeathAnimating(), true);
});

test('players sync clients, reset slots, and remove departed players', async function () {
    const { Players } = await loadGameplayConstructors();
    const figures = [];
    const removed = [];
    const players = new Players(
        {
            addFigure(figure) {
                figures.push(figure);
            }
        },
        {
            remove(id) {
                removed.push(id);
            }
        }
    );

    players.sync({
        clients: [{ id: 'a' }, { id: 'b' }]
    });

    assert.equal(figures.length, 2);
    assert.deepEqual(Object.keys(players.all), ['a', 'b']);
    assert.equal(players.label('a'), 1);

    players.sync({
        clients: [{ id: 'b' }]
    });

    assert.deepEqual(Object.keys(players.all), ['b']);
    assert.deepEqual(removed, ['a']);
});

test('players constrain lobby movement', async function () {
    const { Players } = await loadGameplayConstructors();
    const players = new Players(
        {
            addFigure() {}
        },
        {
            remove() {}
        }
    );
    const lobbyBounds = {
        minX: 90,
        maxX: 110,
        minY: 90,
        maxY: 110
    };

    players.sync(
        {
            clients: [{ id: 'a' }, { id: 'b' }]
        },
        {
            slots: [
                {
                    x: 100,
                    y: 100,
                    facing: 1,
                    frame: 0,
                    movementBounds: lobbyBounds
                },
                {
                    x: 200,
                    y: 100,
                    facing: -1,
                    frame: 2,
                    movementBounds: {
                        minX: 190,
                        maxX: 210,
                        minY: 90,
                        maxY: 110
                    }
                }
            ]
        }
    );

    players.all.a.respondToKeyEvent({ action: 'down', key: 'h' });
    players.all.a.move(0, 1000);

    assert.equal(players.all.a.x, lobbyBounds.minX);

    players.sync(
        {
            clients: [{ id: 'a', name: 'ACE', ready: false }]
        },
        {
            slots: [{ x: 150, y: 430, facing: 1, frame: 0 }]
        }
    );

    assert.equal(players.all.a.movementBounds, null);
});
