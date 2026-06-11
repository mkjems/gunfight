import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadPlayerPositionSync() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/playerPositionSync.ts'),
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

    return module.PlayerPositionSync;
}

test('throttles local player position sync', async function () {
    const PlayerPositionSync = await loadPlayerPositionSync();
    let now = 1000;
    const sent = [];
    const sync = new PlayerPositionSync({
        getTime: function () {
            return now;
        },
        syncInterval: 80
    });
    const player = {
        x: 11,
        y: 22,
        frame: 3,
        aim: 'middle',
        facing: 'right'
    };
    const socket = {
        emit: function (event, payload) {
            sent.push({ event, payload });
        }
    };

    assert.equal(sync.syncLocal({ playing: true, player, socket }), true);
    assert.equal(sync.syncLocal({ playing: true, player, socket }), false);
    now = 1080;
    assert.equal(sync.syncLocal({ playing: true, player, socket }), true);

    assert.deepEqual(
        sent.map(function (message) {
            return {
                event: message.event,
                payload: { ...message.payload }
            };
        }),
        [
            {
                event: 'playerPosition',
                payload: {
                    x: 11,
                    y: 22,
                    frame: 3,
                    aim: 'middle',
                    facing: 'right'
                }
            },
            {
                event: 'playerPosition',
                payload: {
                    x: 11,
                    y: 22,
                    frame: 3,
                    aim: 'middle',
                    facing: 'right'
                }
            }
        ]
    );
});

test('applies remote positions only for active opponents', async function () {
    const PlayerPositionSync = await loadPlayerPositionSync();
    const sync = new PlayerPositionSync();
    const players = {
        all: {
            remote: {
                x: 0,
                y: 0,
                frame: 0,
                aim: 'down',
                facing: 'left'
            }
        }
    };

    assert.equal(
        sync.applyRemote({
            data: { player: 'local', x: 5 },
            localPlayerId: 'local',
            players,
            playing: true
        }),
        false
    );
    assert.equal(
        sync.applyRemote({
            data: {
                player: 'remote',
                x: 10,
                y: 20,
                frame: 2,
                aim: 'up',
                facing: 'right'
            },
            localPlayerId: 'local',
            players,
            playing: true
        }),
        true
    );

    assert.deepEqual(players.all.remote, {
        x: 10,
        y: 20,
        frame: 2,
        aim: 'up',
        facing: 'right'
    });
});
