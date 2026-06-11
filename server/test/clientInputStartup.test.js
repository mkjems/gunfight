import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientInputStartup() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientInputStartup.ts'),
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

    return module.ClientInputStartup;
}

test('creates input and starts touch controls before the game loop', async function () {
    const startup = await loadClientInputStartup();
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

test('does not restart input when an input controller already exists', async function () {
    const startup = await loadClientInputStartup();
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
