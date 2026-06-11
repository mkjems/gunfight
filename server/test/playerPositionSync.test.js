import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadPlayerPositionSync() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/PlayerPositionSync.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.PlayerPositionSync;
}

test('throttles local player position sync', function () {
    const PlayerPositionSync = loadPlayerPositionSync();
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

test('applies remote positions only for active opponents', function () {
    const PlayerPositionSync = loadPlayerPositionSync();
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
