import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientHitDetection(findBulletHit = () => null) {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    HIT_PAUSE: 'hitPause',
                    PLAYING: 'playing',
                    WAITING: 'waiting'
                }
            },
            Collision: {
                findBulletHit
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientHitDetection.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientHitDetection;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('reports match expiry during hit pause', function () {
    const hitDetection = loadClientHitDetection();

    assert.deepEqual(
        plain(
            hitDetection.check({
                matchTimeExpired: true,
                roundState: 'hitPause'
            })
        ),
        {
            type: 'matchExpired'
        }
    );
});

test('marks obstacle bullets for deletion before returning obstacle hits', function () {
    const hitDetection = loadClientHitDetection();
    const bullet = {
        deleteMe: false
    };
    const hit = {
        bullet,
        obstacleId: 'wagon'
    };
    const result = hitDetection.check({
        bullets: { all: () => ({}) },
        findBulletObstacleHit() {
            return hit;
        },
        matchTimeExpired: false,
        players: { all: {} },
        roundState: 'playing'
    });

    assert.equal(result.type, 'obstacleHit');
    assert.equal(result.hit, hit);
    assert.equal(bullet.deleteMe, true);
});

test('marks player hit bullets for deletion before returning player hits', function () {
    const bullet = {
        deleteMe: false
    };
    const hit = {
        bullet,
        targetId: 'p2',
        winnerId: 'p1'
    };
    const hitDetection = loadClientHitDetection(() => hit);
    const result = hitDetection.check({
        bullets: { all: () => ({ b1: bullet }) },
        findBulletObstacleHit() {
            return null;
        },
        matchTimeExpired: false,
        players: { all: {} },
        roundState: 'playing'
    });

    assert.equal(result.type, 'playerHit');
    assert.equal(result.hit, hit);
    assert.equal(bullet.deleteMe, true);
});

test('reports match expiry after hit checks during active play', function () {
    const hitDetection = loadClientHitDetection();

    assert.deepEqual(
        plain(
            hitDetection.check({
                bullets: { all: () => ({}) },
                findBulletObstacleHit() {
                    return null;
                },
                matchTimeExpired: true,
                players: { all: {} },
                roundState: 'playing'
            })
        ),
        {
            type: 'matchExpired'
        }
    );
});
