import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientGameplayInput() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    WAITING: 'waiting',
                    RITUAL: 'ritual',
                    PLAYING: 'playing',
                    HIT_PAUSE: 'hitPause',
                    ROUND_OVER: 'roundOver',
                    GAME_OVER: 'gameOver'
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientGameplayInput.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientGameplayInput;
}

test('fires bullets and stores the shot snapshot on the key event', function () {
    const input = loadClientGameplayInput();
    const calls = [];
    const keyEvent = {
        action: 'down',
        key: ' '
    };
    const player = {
        playerId: 'p1'
    };
    const bullet = {
        toSnapshot() {
            return { id: 'shot-1' };
        }
    };

    input.handle({
        ammo: {
            hasAmmo(id) {
                assert.equal(id, 'p1');
                return true;
            },
            spend(id) {
                calls.push(['spend', id]);
            }
        },
        bullets: {
            fire(firingPlayer, shot) {
                assert.equal(firingPlayer, player);
                assert.equal(shot, undefined);
                calls.push(['fire']);
                return bullet;
            }
        },
        keyEvent,
        player,
        roundState: 'playing',
        onBulletFired(firedBullet) {
            calls.push(['fired', firedBullet]);
        },
        onEmptyGun() {
            calls.push(['empty']);
        }
    });

    assert.deepEqual(calls, [['fire'], ['spend', 'p1'], ['fired', bullet]]);
    assert.deepEqual(keyEvent.shot, { id: 'shot-1' });
});

test('plays empty gun sound when firing without ammo', function () {
    const input = loadClientGameplayInput();
    const calls = [];

    input.handle({
        ammo: {
            hasAmmo() {
                return false;
            },
            spend() {
                calls.push('spend');
            }
        },
        bullets: {
            fire() {
                calls.push('fire');
            }
        },
        keyEvent: {
            action: 'down',
            key: ' '
        },
        player: {
            playerId: 'p1'
        },
        roundState: 'playing',
        onBulletFired() {
            calls.push('fired');
        },
        onEmptyGun() {
            calls.push('empty');
        }
    });

    assert.deepEqual(calls, ['empty']);
});

test('only releases keys during locked round states', function () {
    const input = loadClientGameplayInput();
    const events = [];
    const player = {
        respondToKeyEvent(keyEvent) {
            events.push(keyEvent.action);
        }
    };

    input.handle({
        keyEvent: {
            action: 'down',
            key: 'h'
        },
        player,
        roundState: 'ritual'
    });
    input.handle({
        keyEvent: {
            action: 'up',
            key: 'h'
        },
        player,
        roundState: 'ritual'
    });

    assert.deepEqual(events, ['up']);
});
