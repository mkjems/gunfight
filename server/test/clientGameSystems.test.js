import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientGameSystems() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientGameSystems.ts'),
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

function createConstructors(calls) {
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

    function RoundIntro(options) {
        this.kind = 'roundIntro';
        this.players = options.players;
        calls.push(['RoundIntro', options.players.kind]);
    }

    return {
        Bullet: {},
        Bullets: Bullets,
        ClientAmmo: function () {
            this.kind = 'ammo';
            calls.push('ClientAmmo');
        },
        ClientRoundState: function () {
            this.kind = 'roundData';
            calls.push('ClientRoundState');
        },
        ClientTimers: function () {
            this.kind = 'timers';
            calls.push('ClientTimers');
        },
        PlayerPositionSync: function () {
            this.kind = 'positionSync';
            calls.push('PlayerPositionSync');
        },
        Players: Players,
        RoundIntro: RoundIntro,
        Scene: Scene,
        ScoreKeeper: function () {
            this.kind = 'scoreKeeper';
            calls.push('ScoreKeeper');
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('creates game systems with injectable constructors', async function () {
    const systemsModule = await loadClientGameSystems();
    const calls = [];
    const constructors = createConstructors(calls);
    function playRicochet() {}

    const systems = systemsModule.create({
        ...constructors,
        initialRoundState: 'waiting',
        playRicochet: playRicochet
    });

    assert.equal(systems.scene.kind, 'scene');
    assert.equal(systems.bullets.kind, 'bullets');
    assert.equal(systems.players.kind, 'players');
    assert.equal(systems.roundIntro.kind, 'roundIntro');
    assert.equal(systems.roundState, 'waiting');
    assert.deepEqual(plain(systems.highScores), []);
    assert.equal(systems.scoreKeeper.kind, 'scoreKeeper');
    assert.equal(systems.roundData.kind, 'roundData');
    assert.equal(systems.timers.kind, 'timers');
    assert.equal(systems.positionSync.kind, 'positionSync');
    assert.equal(systems.ammo.kind, 'ammo');
    assert.equal(systems.localReadyRequested, false);
    assert.equal(constructors.Bullet.onRicochet, playRicochet);
    assert.deepEqual(plain(calls), [
        'Scene',
        ['Bullets', 'scene'],
        ['Players', 'scene', 'bullets'],
        ['RoundIntro', 'players'],
        'ClientAmmo',
        'PlayerPositionSync',
        'ClientRoundState',
        'ScoreKeeper',
        'ClientTimers'
    ]);
});
