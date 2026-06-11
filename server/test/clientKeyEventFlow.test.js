import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientKeyEventFlow(gameplayCalls) {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    PLAYING: 'playing',
                    WAITING: 'waiting'
                }
            },
            ClientGameplayInput: {
                handle(options) {
                    gameplayCalls.push({
                        keyEvent: options.keyEvent,
                        player: options.player,
                        roundState: options.roundState
                    });
                    if (options.keyEvent.key === ' ') {
                        options.onBulletFired();
                    }
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientKeyEventFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientKeyEventFlow;
}

function createOptions(overrides = {}) {
    const calls = [];
    const player = {
        id: 'p1'
    };

    return {
        calls,
        options: {
            ammo: {},
            bullets: {},
            isLocalClientWaiting() {
                calls.push('isLocalClientWaiting');

                return true;
            },
            keyEvent: {
                key: 'h',
                player: 'p1'
            },
            nameEditor: null,
            onBulletFired() {
                calls.push('onBulletFired');
            },
            onEmptyGun() {
                calls.push('onEmptyGun');
            },
            player: player,
            playerId: 'p1',
            renderHud() {
                calls.push('renderHud');
            },
            roundState: 'playing',
            ...overrides
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('blocks local edit key while the local client is not waiting', function () {
    const gameplayCalls = [];
    const flow = loadClientKeyEventFlow(gameplayCalls);
    const { calls, options } = createOptions({
        isLocalClientWaiting() {
            calls.push('isLocalClientWaiting');

            return false;
        },
        keyEvent: {
            key: 'e',
            player: 'p1'
        },
        roundState: 'waiting'
    });

    assert.equal(flow.handle(options), false);
    assert.deepEqual(calls, ['isLocalClientWaiting']);
    assert.deepEqual(gameplayCalls, []);
});

test('routes waiting local key events through the active name editor', function () {
    const gameplayCalls = [];
    const flow = loadClientKeyEventFlow(gameplayCalls);
    const { calls, options } = createOptions({
        keyEvent: {
            key: 'h',
            player: 'p1'
        },
        nameEditor: {
            handleKeyEvent(keyEvent) {
                calls.push(['nameEditor.handleKeyEvent', keyEvent.key]);

                return false;
            }
        },
        roundState: 'waiting'
    });

    assert.equal(flow.handle(options), false);
    assert.deepEqual(plain(calls), [
        ['nameEditor.handleKeyEvent', 'h'],
        'renderHud'
    ]);
    assert.deepEqual(gameplayCalls, []);
});

test('delegates gameplay key events to gameplay input', function () {
    const gameplayCalls = [];
    const flow = loadClientKeyEventFlow(gameplayCalls);
    const { calls, options } = createOptions({
        keyEvent: {
            key: ' ',
            player: 'p1'
        }
    });

    assert.equal(flow.handle(options), undefined);
    assert.deepEqual(plain(gameplayCalls), [
        {
            keyEvent: {
                key: ' ',
                player: 'p1'
            },
            player: {
                id: 'p1'
            },
            roundState: 'playing'
        }
    ]);
    assert.deepEqual(calls, ['onBulletFired']);
});
