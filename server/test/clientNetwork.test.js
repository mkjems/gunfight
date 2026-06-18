import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientNetwork() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/network/clientNetwork.ts'),
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

    return module.ClientNetwork;
}

test('connects with stored player name and forwards socket events', async function () {
    const ClientNetwork = await loadClientNetwork();
    const registered = {};
    const calls = [];
    /** @type {(callback: (payload: { name?: string }) => void) => void} */
    let authProvider = function (_callback) {
        throw new Error('Expected socket auth provider');
    };
    let storedPlayerName = 'ACE';
    const network = new ClientNetwork({
        getStoredPlayerName() {
            return storedPlayerName;
        },
        io(options) {
            authProvider = options.auth;
            calls.push(['io']);

            return {
                on(event, callback) {
                    registered[event] = callback;
                }
            };
        },
        onHighScores(data) {
            calls.push(['highScores', data]);
        },
        onJoinedGame(data) {
            calls.push(['joinedGame', data]);
        },
        onKeyEvent(data) {
            calls.push(['keyEvent', data]);
        },
        onModelUpdate(data) {
            calls.push(['modelUpdate', data]);
        },
        onObstacleDamage(data) {
            calls.push(['obstacleDamage', data]);
        },
        onPlayerPosition(data) {
            calls.push(['playerPosition', data]);
        }
    });

    assert.equal(typeof network.socket.on, 'function');
    assert.equal(typeof authProvider, 'function');

    authProvider(function (payload) {
        calls.push(['auth', payload]);
    });
    storedPlayerName = 'DOC';
    authProvider(function (payload) {
        calls.push(['auth', payload]);
    });

    registered.highScores(['score']);
    registered.joinedGame({ playerId: 'p1' });
    registered.keyEvent({ key: 'h' });
    registered.playerPosition({ x: 1 });
    registered.obstacleDamage({ id: 'wagon' });
    registered.newClient({ id: 'new' });
    registered.modelUpdate({ id: 'model' });

    assert.deepEqual(calls, [
        ['io'],
        ['auth', { name: 'ACE' }],
        ['auth', { name: 'DOC' }],
        ['highScores', ['score']],
        ['joinedGame', { playerId: 'p1' }],
        ['keyEvent', { key: 'h' }],
        ['playerPosition', { x: 1 }],
        ['obstacleDamage', { id: 'wagon' }],
        ['modelUpdate', { id: 'new' }],
        ['modelUpdate', { id: 'model' }]
    ]);
});
