import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientGameLoop() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientGameLoop.ts'),
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

    return module.ClientGameLoop;
}

test('runs update and render once when started', async function () {
    const ClientGameLoop = await loadClientGameLoop();
    const calls = [];
    const loop = new ClientGameLoop({
        render() {
            calls.push('render');
        },
        scheduleFrame() {
            calls.push('schedule');
        },
        update() {
            calls.push('update');
        }
    });

    assert.equal(loop.start(), true);
    assert.deepEqual(calls, ['update', 'render', 'schedule']);
    assert.equal(loop.start(), false);
});

test('stops future ticks', async function () {
    const ClientGameLoop = await loadClientGameLoop();
    const calls = [];
    /** @type {undefined | (() => void)} */
    let scheduled;
    const loop = new ClientGameLoop({
        render() {
            calls.push('render');
        },
        scheduleFrame(callback) {
            scheduled = callback;
        },
        update() {
            calls.push('update');
        }
    });

    loop.start();
    loop.stop();
    if (typeof scheduled !== 'function') {
        throw new Error('expected a scheduled frame callback');
    }
    scheduled();

    assert.deepEqual(calls, ['update', 'render']);
});
