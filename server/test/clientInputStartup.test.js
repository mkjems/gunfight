import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientInputStartup() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientInputStartup.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientInputStartup;
}

test('creates input and starts touch controls before the game loop', function () {
    const startup = loadClientInputStartup();
    const calls = [];
    const input = {
        id: 'input'
    };

    assert.equal(
        startup.start({
            createInputController() {
                calls.push('createInputController');

                return input;
            },
            initTouchControls() {
                calls.push('initTouchControls');
            },
            inputController: null,
            startGameLoop() {
                calls.push('startGameLoop');
            }
        }),
        input
    );
    assert.deepEqual(calls, [
        'createInputController',
        'initTouchControls',
        'startGameLoop'
    ]);
});

test('does not restart input when an input controller already exists', function () {
    const startup = loadClientInputStartup();
    const input = {
        id: 'input'
    };

    assert.equal(
        startup.start({
            createInputController() {
                throw new Error('should not create input twice');
            },
            initTouchControls() {
                throw new Error('should not init touch controls twice');
            },
            inputController: input,
            startGameLoop() {
                throw new Error('should not start game loop twice');
            }
        }),
        input
    );
});
