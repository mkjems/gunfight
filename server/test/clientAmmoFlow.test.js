import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientAmmoFlow() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    PLAYING: 'playing',
                    WAITING: 'waiting'
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientAmmoFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientAmmoFlow;
}

function createOptions(overrides = {}) {
    const calls = [];
    const options = {
        ammo: {
            reloadIfAllEmpty(clients) {
                calls.push(['ammo.reloadIfAllEmpty', clients.length]);

                return true;
            }
        },
        model: {
            clients: [{ id: 'p1' }, { id: 'p2' }]
        },
        roundState: 'playing'
    };

    return {
        calls,
        options: {
            ...options,
            ...overrides
        }
    };
}

test('reloads when playing with both clients in the model', function () {
    const flow = loadClientAmmoFlow();
    const { calls, options } = createOptions();

    assert.equal(flow.reloadIfBothPlayersAreOut(options), true);
    assert.deepEqual(calls, [['ammo.reloadIfAllEmpty', 2]]);
});

test('does not reload outside active play', function () {
    const flow = loadClientAmmoFlow();
    const { calls, options } = createOptions({
        roundState: 'waiting'
    });

    assert.equal(flow.reloadIfBothPlayersAreOut(options), false);
    assert.deepEqual(calls, []);
});

test('does not reload without two clients', function () {
    const flow = loadClientAmmoFlow();
    const { calls, options } = createOptions({
        model: {
            clients: [{ id: 'p1' }]
        }
    });

    assert.equal(flow.reloadIfBothPlayersAreOut(options), false);
    assert.deepEqual(calls, []);
});

test('does not reload without a model', function () {
    const flow = loadClientAmmoFlow();
    const { calls, options } = createOptions({
        model: null
    });

    assert.equal(flow.reloadIfBothPlayersAreOut(options), false);
    assert.deepEqual(calls, []);
});
