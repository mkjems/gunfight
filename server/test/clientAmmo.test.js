import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientAmmo() {
    const context = {
        GF: {
            Config: {
                round: {
                    ammo: 6
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientAmmo.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientAmmo;
}

test('tracks ammo per client', function () {
    const ClientAmmo = loadClientAmmo();
    const ammo = new ClientAmmo({ maxAmmo: 2 });

    ammo.reset([{ id: 'p1' }, { id: 'p2' }]);

    assert.equal(ammo.get('p1'), 2);
    assert.equal(ammo.hasAmmo('p1'), true);
    assert.equal(ammo.spend('p1'), true);
    assert.equal(ammo.get('p1'), 1);
    assert.equal(ammo.spend('unknown'), false);
});

test('reloads only when both players are out of ammo', function () {
    const ClientAmmo = loadClientAmmo();
    const ammo = new ClientAmmo({ maxAmmo: 1 });
    const clients = [{ id: 'p1' }, { id: 'p2' }];

    ammo.reset(clients);
    ammo.spend('p1');

    assert.equal(ammo.reloadIfAllEmpty(clients), false);
    assert.equal(ammo.get('p1'), 0);
    assert.equal(ammo.get('p2'), 1);

    ammo.spend('p2');

    assert.equal(ammo.reloadIfAllEmpty(clients), true);
    assert.equal(ammo.get('p1'), 1);
    assert.equal(ammo.get('p2'), 1);
});

test('reset clears stale players', function () {
    const ClientAmmo = loadClientAmmo();
    const ammo = new ClientAmmo({ maxAmmo: 3 });

    ammo.reset([{ id: 'p1' }]);
    ammo.reset([{ id: 'p2' }]);

    assert.equal(ammo.get('p1'), 0);
    assert.equal(ammo.get('p2'), 3);
});
