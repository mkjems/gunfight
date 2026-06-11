import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientObstacleSync() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientObstacleSync.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientObstacleSync;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('emits and applies local obstacle hits from the owning player', function () {
    const sync = loadClientObstacleSync();
    const applied = [];
    const emitted = [];

    assert.equal(
        sync.handleLocalHit({
            applyDamage(payload) {
                applied.push(payload);
            },
            hit: {
                bullet: { ownerId: 'p1' },
                obstacleId: 'wagon'
            },
            model: { roundNumber: 3 },
            playerId: 'p1',
            socket: {
                emit(event, payload) {
                    emitted.push({ event, payload });
                }
            }
        }),
        true
    );

    assert.deepEqual(plain(applied), [
        { id: 'wagon', ownerId: 'p1', roundNumber: 3 }
    ]);
    assert.deepEqual(plain(emitted), [
        {
            event: 'obstacleDamage',
            payload: { id: 'wagon', ownerId: 'p1', roundNumber: 3 }
        }
    ]);
});

test('ignores obstacle hits owned by another player', function () {
    const sync = loadClientObstacleSync();
    const calls = [];

    assert.equal(
        sync.handleLocalHit({
            applyDamage() {
                calls.push('apply');
            },
            hit: {
                bullet: { ownerId: 'p2' },
                obstacleId: 'wagon'
            },
            model: { roundNumber: 3 },
            playerId: 'p1',
            socket: {
                emit() {
                    calls.push('emit');
                }
            }
        }),
        false
    );
    assert.deepEqual(calls, []);
});

test('applies obstacle damage only for the current round', function () {
    const sync = loadClientObstacleSync();
    const calls = [];

    assert.equal(
        sync.applyDamage({
            bullets: {
                remove(ownerId) {
                    calls.push(['remove', ownerId]);
                }
            },
            damageObstacle(id) {
                calls.push(['damage', id]);
            },
            data: { id: 'wagon', ownerId: 'p1', roundNumber: 2 },
            model: { roundNumber: 3 },
            playObstacleHit(id) {
                calls.push(['sound', id]);
            }
        }),
        false
    );
    assert.deepEqual(calls, []);

    assert.equal(
        sync.applyDamage({
            bullets: {
                remove(ownerId) {
                    calls.push(['remove', ownerId]);
                }
            },
            damageObstacle(id) {
                calls.push(['damage', id]);
            },
            data: { id: 'wagon', ownerId: 'p1', roundNumber: 3 },
            model: { roundNumber: 3 },
            playObstacleHit(id) {
                calls.push(['sound', id]);
            }
        }),
        true
    );
    assert.deepEqual(calls, [
        ['damage', 'wagon'],
        ['sound', 'wagon'],
        ['remove', 'p1']
    ]);
});
