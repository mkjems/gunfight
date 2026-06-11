import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientNameEditorFlow() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientNameEditorFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientNameEditorFlow;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('submits name changes through the socket', function () {
    const flow = loadClientNameEditorFlow();
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

test('submits an empty name when name is missing', function () {
    const flow = loadClientNameEditorFlow();
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

test('does not submit name changes without a socket', function () {
    const flow = loadClientNameEditorFlow();

    assert.equal(
        flow.submitNameChange({
            name: 'ACE',
            socket: null
        }),
        false
    );
});

test('syncs the name editor through identity state', function () {
    const flow = loadClientNameEditorFlow();
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

test('closes active name editors only', function () {
    const flow = loadClientNameEditorFlow();
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
