import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientIdentity() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientIdentity.ts'),
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

    return module.ClientIdentity;
}

function createStorage() {
    const values = {};

    return {
        getItem(key) {
            return values[key] || null;
        },
        setItem(key, value) {
            values[key] = value;
        }
    };
}

test('stores and reads player names safely', async function () {
    const ClientIdentity = await loadClientIdentity();
    const identity = new ClientIdentity({
        getClientName(client) {
            return client.name;
        },
        storage: createStorage()
    });

    assert.equal(identity.getStoredPlayerName(), '');
    assert.equal(identity.storePlayerName('ACE'), true);
    assert.equal(identity.getStoredPlayerName(), 'ACE');
    assert.equal(identity.storePlayerName(''), false);
});

test('ignores local storage failures', async function () {
    const ClientIdentity = await loadClientIdentity();
    const identity = new ClientIdentity({
        getClientName(client) {
            return client.name;
        },
        storage: {
            getItem() {
                throw new Error('blocked');
            },
            setItem() {
                throw new Error('blocked');
            }
        }
    });

    assert.equal(identity.getStoredPlayerName(), '');
    assert.equal(identity.storePlayerName('ACE'), false);
});

test('syncs inactive name editors from the local client', async function () {
    const ClientIdentity = await loadClientIdentity();
    const storage = createStorage();
    const names = [];
    const identity = new ClientIdentity({
        getClientName(client) {
            return client.name || 'PLAYER ' + (client.slot + 1);
        },
        storage
    });

    assert.equal(
        identity.syncNameEditor({
            client: { name: '', slot: 1 },
            editor: {
                isActive() {
                    return false;
                },
                setName(name) {
                    names.push(name);
                }
            }
        }),
        true
    );

    assert.deepEqual(names, ['PLAYER 2']);
    assert.equal(storage.getItem('gunfight-player-name'), 'PLAYER 2');
});

test('does not sync active name editors', async function () {
    const ClientIdentity = await loadClientIdentity();
    const identity = new ClientIdentity({
        getClientName(client) {
            return client.name;
        },
        storage: createStorage()
    });

    assert.equal(
        identity.syncNameEditor({
            client: { name: 'ACE' },
            editor: {
                isActive() {
                    return true;
                },
                setName() {
                    throw new Error('should not set active editor names');
                }
            }
        }),
        false
    );
});
