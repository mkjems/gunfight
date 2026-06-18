import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientObstacleSync() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/network/clientObstacleSync.ts'),
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

    return module.ClientObstacleSync;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('emits and applies local obstacle hits from the owning player', async function () {
    const sync = await loadClientObstacleSync();
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
            model: { duelNumber: 3 },
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
        { id: 'wagon', ownerId: 'p1', duelNumber: 3 }
    ]);
    assert.deepEqual(plain(emitted), [
        {
            event: 'obstacleDamage',
            payload: { id: 'wagon', ownerId: 'p1', duelNumber: 3 }
        }
    ]);
});

test('ignores obstacle hits owned by another player', async function () {
    const sync = await loadClientObstacleSync();
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
            model: { duelNumber: 3 },
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

test('applies obstacle damage only for the current duel', async function () {
    const sync = await loadClientObstacleSync();
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
            data: { id: 'wagon', ownerId: 'p1', duelNumber: 2 },
            model: { duelNumber: 3 },
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
            data: { id: 'wagon', ownerId: 'p1', duelNumber: 3 },
            model: { duelNumber: 3 },
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
