import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    const outputPath = path.join(tempDirectory, outputName);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, transpiled.outputText, 'utf8');
}

async function loadClientGameplayInput() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientGameplayInput.ts',
        'flows/clientGameplayInput.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientGameplayInput.js'))
            .href
    );

    return module.ClientGameplayInput;
}

test('fires bullets and stores the shot snapshot on the key event', async function () {
    const input = await loadClientGameplayInput();
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
        onGunFired(firedBullet) {
            calls.push(['gun', firedBullet]);
        },
        onBulletFired(firedBullet) {
            calls.push(['fired', firedBullet]);
        },
        onEmptyGun() {
            calls.push(['empty']);
        }
    });

    assert.deepEqual(calls, [
        ['fire'],
        ['gun', bullet],
        ['spend', 'p1'],
        ['fired', bullet]
    ]);
    assert.deepEqual(keyEvent.shot, { id: 'shot-1' });
});

test('does not play gun sound when the shot is rejected', async function () {
    const input = await loadClientGameplayInput();
    const calls = [];

    input.handle({
        ammo: {
            hasAmmo() {
                return true;
            },
            spend() {
                calls.push('spend');
            }
        },
        bullets: {
            fire() {
                calls.push('fire');
                return false;
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
        onGunFired() {
            calls.push('gun');
        },
        onBulletFired() {
            calls.push('fired');
        },
        onEmptyGun() {
            calls.push('empty');
        }
    });

    assert.deepEqual(calls, ['fire']);
});

test('plays empty gun sound when firing without ammo', async function () {
    const input = await loadClientGameplayInput();
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

test('activates the lobby gun without firing bullets while waiting', async function () {
    const input = await loadClientGameplayInput();
    const calls = [];
    const player = {
        playerId: 'p1'
    };

    input.handle({
        ammo: {
            hasAmmo() {
                calls.push('hasAmmo');
                return true;
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
        player,
        roundState: 'waiting',
        onGunFired() {
            calls.push('gun');
        },
        onWaitingFire(firingPlayer) {
            calls.push(['waitingFire', firingPlayer]);
        },
        onBulletFired() {
            calls.push('fired');
        },
        onEmptyGun() {
            calls.push('empty');
        }
    });

    assert.deepEqual(calls, [['waitingFire', player]]);
});

test('only releases keys during locked round states', async function () {
    const input = await loadClientGameplayInput();
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
