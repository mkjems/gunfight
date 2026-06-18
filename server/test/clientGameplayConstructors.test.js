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

    const [
        bulletModule,
        bulletsModule,
        configModule,
        controllableModule,
        playersModule
    ] = await Promise.all(
        [
            'engine/bullet.js',
            'engine/bullets.js',
            'platform/config.js',
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
        Config: configModule.Config,
        getRoundBulletStraightness: configModule.getRoundBulletStraightness,
        Controllable: controllableModule.Controllable,
        Players: playersModule.Players
    };
}

test('derives shooting straightness from the round number', async function () {
    const { Config, getRoundBulletStraightness } =
        await loadGameplayConstructors();

    assert.equal(
        getRoundBulletStraightness(),
        Config.bullet.defaultStraightness
    );
    assert.equal(
        getRoundBulletStraightness(1),
        Config.bullet.defaultStraightness
    );
    assert.equal(
        getRoundBulletStraightness(3),
        Config.bullet.defaultStraightness +
            Config.bullet.roundStraightnessStep * 2
    );
    assert.equal(getRoundBulletStraightness(99), Config.bullet.maxStraightness);
});

test('bullets fire once per owner and expose snapshots', async function () {
    const { Bullets, Config } = await loadGameplayConstructors();
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
    assert.equal(
        bullet.toSnapshot().straightness,
        Config.bullet.defaultStraightness
    );
    assert.equal(
        bullet.isHarmful,
        Config.bullet.defaultStraightness >=
            Config.bullet.minimumHarmStraightness &&
            Config.bullet.speed >= Config.bullet.harmVelocity
    );

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
            straightness: 1,
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

test('low-straightness bullets settle and allow another shot', async function () {
    const { Bullets } = await loadGameplayConstructors();
    const bullets = new Bullets({
        addFigure() {}
    });
    const player = {
        aim: 4,
        facing: 1,
        playerId: 'p1',
        shootingStraightness: 0.2,
        x: 100,
        y: 200
    };
    const bullet = bullets.fire(player, {
        speedX: 80,
        speedY: 0,
        x: 100,
        y: 200
    });

    for (let i = 0; i < 600 && !bullet.isResting; i += 1) {
        bullet.moveStep(1 / 60);
    }

    assert.equal(bullet.isResting, true);
    assert.equal(bullet.isHarmful, false);
    assert.deepEqual(bullets.all(), {});

    const nextBullet = bullets.fire(player, { straightness: 1 });

    assert.notEqual(nextBullet, false);
    assert.notEqual(nextBullet, bullet);
});

test('new bullets keep the frozen muzzle position for their first scene move', async function () {
    const { Bullet, Config } = await loadGameplayConstructors();
    const bullet = new Bullet(
        {
            aim: 4,
            facing: 1,
            playerId: 'p1',
            shootingStraightness: 0.5,
            x: 100,
            y: 200
        },
        {
            straightness: 0.5
        }
    );
    const start = bullet.toSnapshot();

    Bullet.setCollisionLines([]);
    bullet.move(0, 1000);

    assert.equal(bullet.x, start.x);
    assert.equal(bullet.y, start.y);

    bullet.move(1000, 1000 + Config.bullet.fixedStep * 2000);

    assert.notEqual(bullet.x, start.x);
});

test('dragged bullets settle at mirrored distances for both facings', async function () {
    const { Bullet } = await loadGameplayConstructors();

    Bullet.setCollisionLines([]);

    [0.3, 0.5, 0.8].forEach(function (straightness) {
        const left = new Bullet(
            {
                aim: 4,
                facing: 1,
                playerId: 'left',
                shootingStraightness: straightness,
                x: 118.58,
                y: 320.29
            },
            { straightness }
        );
        const right = new Bullet(
            {
                aim: 4,
                facing: -1,
                playerId: 'right',
                shootingStraightness: straightness,
                x: 840.4,
                y: 321.23
            },
            { straightness }
        );
        const leftStart = left.x;
        const rightStart = right.x;

        for (
            let i = 0;
            i < 2000 && (!left.isResting || !right.isResting);
            i += 1
        ) {
            if (!left.isResting) {
                left.moveStep(1 / 120);
            }

            if (!right.isResting) {
                right.moveStep(1 / 120);
            }
        }

        assert.equal(left.isResting, true);
        assert.equal(right.isResting, true);
        assert.ok(
            Math.abs(left.x - leftStart - (rightStart - right.x)) < 0.000001
        );
    });
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

test('players refresh round-based shooting straightness on sync and reset', async function () {
    const { Config, Players, getRoundBulletStraightness } =
        await loadGameplayConstructors();
    const players = new Players(
        {
            addFigure() {}
        },
        {
            remove() {}
        }
    );

    players.sync(
        {
            clients: [{ id: 'a' }, { id: 'b' }]
        },
        {
            roundNumber: 2
        }
    );
    assert.equal(
        players.all.a.shootingStraightness,
        getRoundBulletStraightness(2)
    );
    players.all.a.shootingStraightness = Config.bullet.defaultStraightness / 2;
    players.all.b.shootingStraightness = Config.bullet.defaultStraightness / 3;

    players.sync(
        {
            clients: [{ id: 'a' }, { id: 'b' }]
        },
        {
            roundNumber: 3
        }
    );

    assert.equal(
        players.all.a.shootingStraightness,
        getRoundBulletStraightness(3)
    );
    assert.equal(
        players.all.b.shootingStraightness,
        getRoundBulletStraightness(3)
    );

    players.all.a.shootingStraightness = Config.bullet.defaultStraightness / 4;
    players.resetAll({
        roundNumber: 99
    });

    assert.equal(
        players.all.a.shootingStraightness,
        getRoundBulletStraightness(99)
    );
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

test('players use server slot values for lobby slots', async function () {
    const { Players } = await loadGameplayConstructors();
    const players = new Players(
        {
            addFigure() {}
        },
        {
            remove() {}
        }
    );

    players.sync(
        {
            clients: [
                { id: 'local', slot: 1 },
                { id: 'remote', slot: 0 }
            ]
        },
        {
            resetChangedSlots: true,
            slots: [
                { x: 100, y: 100, facing: 1, frame: 0 },
                { x: 200, y: 100, facing: -1, frame: 2 }
            ]
        }
    );

    assert.equal(players.all.remote.slot, 0);
    assert.equal(players.all.remote.x, 100);
    assert.equal(players.all.local.slot, 1);
    assert.equal(players.all.local.x, 200);
});

test('players can force existing clients back to lobby slots', async function () {
    const { Players } = await loadGameplayConstructors();
    const players = new Players(
        {
            addFigure() {}
        },
        {
            remove() {}
        }
    );

    players.sync(
        {
            clients: [{ id: 'local' }, { id: 'remote' }]
        },
        {
            slots: [
                { x: 150, y: 430, facing: 1, frame: 0 },
                { x: 800, y: 430, facing: -1, frame: 2 }
            ]
        }
    );
    players.all.local.x = 330;
    players.all.remote.x = 650;

    players.sync(
        {
            clients: [{ id: 'local' }, { id: 'remote' }]
        },
        {
            resetExisting: true,
            slots: [
                { x: 150, y: 400, facing: 1, frame: 0 },
                { x: 800, y: 400, facing: -1, frame: 2 }
            ]
        }
    );

    assert.equal(players.all.local.x, 150);
    assert.equal(players.all.local.y, 400);
    assert.equal(players.all.remote.x, 800);
    assert.equal(players.all.remote.y, 400);
});
