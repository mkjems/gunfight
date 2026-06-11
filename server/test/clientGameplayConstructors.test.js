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

async function loadGameplayConstructors() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    [
        'config.ts',
        'color.ts',
        'pen.ts',
        'obstacles.ts',
        'bullet.ts',
        'bullets.ts',
        'controllable.ts',
        'players.ts'
    ].forEach(function (sourceName) {
        compileClientModule(
            sourceName,
            sourceName.replace(/\.ts$/, '.js'),
            tempDirectory
        );
    });

    const [bulletModule, bulletsModule, controllableModule, playersModule] =
        await Promise.all(
            ['bullet.js', 'bullets.js', 'controllable.js', 'players.js'].map(
                function (fileName) {
                    return import(
                        pathToFileURL(path.join(tempDirectory, fileName)).href
                    );
                }
            )
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
