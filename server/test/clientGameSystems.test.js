import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientGameSystems() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/runtime/clientGameSystems.ts'),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });
    const encoded = Buffer.from(transpiled.outputText).toString('base64');
    const module = await import('data:text/javascript;base64,' + encoded);

    return module.ClientGameSystems;
}

function createSystemBuilders(calls) {
    function Scene() {
        this.kind = 'scene';
        calls.push('Scene');
    }

    function Bullets(scene) {
        this.kind = 'bullets';
        this.scene = scene;
        calls.push(['Bullets', scene.kind]);
    }

    function Players(scene, bullets) {
        this.kind = 'players';
        this.bullets = bullets;
        this.scene = scene;
        calls.push(['Players', scene.kind, bullets.kind]);
    }

    function DuelIntro(options) {
        this.kind = 'duelIntro';
        this.players = options.players;
        calls.push(['DuelIntro', options.players.kind]);
    }

    return {
        Bullet: {},
        createAmmo() {
            calls.push('ClientAmmo');

            return {
                kind: 'ammo'
            };
        },
        createBullets(scene) {
            return new Bullets(scene);
        },
        createParticleLayer() {
            calls.push('ParticleLayer');

            return {
                kind: 'particleLayer'
            };
        },
        createPlayers(scene, bullets) {
            return new Players(scene, bullets);
        },
        createPositionSync() {
            calls.push('PlayerPositionSync');

            return {
                kind: 'positionSync'
            };
        },
        createDuelData() {
            calls.push('ClientDuelState');

            return {
                kind: 'duelData'
            };
        },
        createDuelIntro(players) {
            return new DuelIntro({
                players
            });
        },
        createScene() {
            return new Scene();
        },
        createScoreKeeper() {
            calls.push('ScoreKeeper');

            return {
                kind: 'scoreKeeper'
            };
        },
        createTimers() {
            calls.push('ClientTimers');

            return {
                kind: 'timers'
            };
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('creates game systems with injectable system builders', async function () {
    const systemsModule = await loadClientGameSystems();
    const calls = [];
    const builders = createSystemBuilders(calls);
    function playRicochet() {}

    const systems = systemsModule.create({
        ...builders,
        initialDuelState: 'waiting',
        playRicochet: playRicochet
    });

    assert.equal(systems.scene.kind, 'scene');
    assert.equal(systems.bullets.kind, 'bullets');
    assert.equal(systems.players.kind, 'players');
    assert.equal(systems.particleLayer.kind, 'particleLayer');
    assert.equal(systems.duelIntro.kind, 'duelIntro');
    assert.equal(systems.duelState, 'waiting');
    assert.deepEqual(plain(systems.highScores), []);
    assert.equal(systems.scoreKeeper.kind, 'scoreKeeper');
    assert.equal(systems.duelData.kind, 'duelData');
    assert.equal(systems.timers.kind, 'timers');
    assert.equal(systems.positionSync.kind, 'positionSync');
    assert.equal(systems.ammo.kind, 'ammo');
    assert.equal(systems.localReadyRequested, false);
    assert.equal(builders.Bullet.onRicochet, playRicochet);
    assert.deepEqual(plain(calls), [
        'Scene',
        ['Bullets', 'scene'],
        ['Players', 'scene', 'bullets'],
        ['DuelIntro', 'players'],
        'ClientAmmo',
        'ParticleLayer',
        'PlayerPositionSync',
        'ClientDuelState',
        'ScoreKeeper',
        'ClientTimers'
    ]);
});
