import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createKeyEventPayload,
    createPlayerPositionPayload,
    getNameFromPayload,
    normalizeBulletSnapshot,
    normalizeGameResultPayload,
    normalizeObstacleDamagePayload,
    shouldRejoinAfterLeave
} from '../../shared/contracts.js';

const shot = {
    x: 10,
    y: 20,
    speedX: 300,
    speedY: -40,
    facing: 1,
    aim: 2,
    width: 3,
    height: 4,
    hasRicocheted: true
};

test('extracts player names from string and object payloads', function () {
    assert.equal(getNameFromPayload('kid'), 'kid');
    assert.equal(getNameFromPayload({ name: 'doc' }), 'doc');
    assert.equal(getNameFromPayload({ other: 'nope' }), undefined);
    assert.equal(getNameFromPayload(null), undefined);
});

test('normalizes key events and shot snapshots', function () {
    assert.deepEqual(
        createKeyEventPayload(
            {
                action: 'down',
                key: ' ',
                shot: shot
            },
            2
        ),
        {
            action: 'down',
            key: ' ',
            player: 2,
            shot: shot
        }
    );

    assert.equal(
        createKeyEventPayload(
            {
                action: 'press',
                key: ' '
            },
            2
        ),
        null
    );
    assert.equal(
        createKeyEventPayload(
            {
                action: 'down',
                key: ' ',
                shot: { ...shot, width: 'wide' }
            },
            2
        ),
        null
    );
});

test('defaults absent bullet ricochet state to false', function () {
    const normalized = normalizeBulletSnapshot({
        x: 10,
        y: 20,
        speedX: 300,
        speedY: -40,
        facing: 1,
        aim: 2,
        width: 3,
        height: 4
    });

    assert.equal(normalized.hasRicocheted, false);
});

test('normalizes player position payloads with server-owned player id', function () {
    assert.deepEqual(
        createPlayerPositionPayload(
            {
                x: 11,
                y: 22,
                frame: 1,
                aim: 2,
                facing: -1,
                player: 999
            },
            3
        ),
        {
            x: 11,
            y: 22,
            frame: 1,
            aim: 2,
            facing: -1,
            player: 3
        }
    );

    assert.equal(
        createPlayerPositionPayload(
            {
                x: 11,
                y: Number.NaN,
                frame: 1,
                aim: 2,
                facing: -1
            },
            3
        ),
        null
    );
});

test('normalizes obstacle damage payloads', function () {
    assert.deepEqual(
        normalizeObstacleDamagePayload({
            id: 'rock-1',
            ownerId: 2,
            roundNumber: 4
        }),
        {
            id: 'rock-1',
            ownerId: 2,
            roundNumber: 4
        }
    );

    assert.equal(
        normalizeObstacleDamagePayload({
            id: '',
            ownerId: 2,
            roundNumber: 4
        }),
        null
    );
});

test('normalizes game result payloads', function () {
    assert.deepEqual(
        normalizeGameResultPayload({
            resultId: 'G0001:2',
            gameId: 'G0001',
            roundNumber: 2,
            clients: [
                {
                    name: 'KID',
                    slot: 0
                },
                {
                    name: 'DOC',
                    slot: 1
                }
            ],
            scores: [3, 1]
        }),
        {
            resultId: 'G0001:2',
            gameId: 'G0001',
            roundNumber: 2,
            clients: [
                {
                    name: 'KID',
                    slot: 0
                },
                {
                    name: 'DOC',
                    slot: 1
                }
            ],
            scores: [3, 1]
        }
    );

    assert.equal(
        normalizeGameResultPayload({
            resultId: 'G0001:2',
            clients: [{ name: 'KID', slot: 0 }],
            scores: [Number.POSITIVE_INFINITY]
        }),
        null
    );
});

test('only explicit leave rejoin requests pass the guard', function () {
    assert.equal(shouldRejoinAfterLeave({ rejoin: true }), true);
    assert.equal(shouldRejoinAfterLeave({ rejoin: 'true' }), false);
    assert.equal(shouldRejoinAfterLeave(undefined), false);
});
