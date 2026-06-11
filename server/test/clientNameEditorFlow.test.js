import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientNameEditorFlow() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientNameEditorFlow.ts'),
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

    return module.ClientNameEditorFlow;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('submits name changes through the socket', async function () {
    const flow = await loadClientNameEditorFlow();
    const calls = [];

    assert.equal(
        flow.submitNameChange({
            name: 'ACE',
            socket: {
                emit(event, payload) {
                    calls.push([event, payload]);
                }
            }
        }),
        true
    );
    assert.deepEqual(plain(calls), [
        [
            'updateName',
            {
                name: 'ACE'
            }
        ]
    ]);
});

test('submits an empty name when name is missing', async function () {
    const flow = await loadClientNameEditorFlow();
    const calls = [];

    flow.submitNameChange({
        socket: {
            emit(event, payload) {
                calls.push([event, payload]);
            }
        }
    });

    assert.deepEqual(plain(calls), [
        [
            'updateName',
            {
                name: ''
            }
        ]
    ]);
});

test('does not submit name changes without a socket', async function () {
    const flow = await loadClientNameEditorFlow();

    assert.equal(
        flow.submitNameChange({
            name: 'ACE',
            socket: null
        }),
        false
    );
});

test('syncs the name editor through identity state', async function () {
    const flow = await loadClientNameEditorFlow();
    const calls = [];
    const client = {
        id: 'p1'
    };
    const editor = {};

    assert.equal(
        flow.sync({
            client: client,
            editor: editor,
            identity: {
                syncNameEditor(options) {
                    calls.push(options);

                    return true;
                }
            }
        }),
        true
    );
    assert.deepEqual(plain(calls), [
        {
            client: client,
            editor: editor
        }
    ]);
});

test('closes active name editors only', async function () {
    const flow = await loadClientNameEditorFlow();
    const calls = [];

    assert.equal(
        flow.close({
            close() {
                calls.push('close');
            },
            isActive() {
                return true;
            }
        }),
        true
    );
    assert.equal(
        flow.close({
            close() {
                calls.push('inactive-close');
            },
            isActive() {
                return false;
            }
        }),
        false
    );
    assert.equal(flow.close(null), false);
    assert.deepEqual(calls, ['close']);
});
