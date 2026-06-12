import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientTimers() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/state/clientTimers.ts'),
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

    return module.ClientTimers;
}

test('tracks and clears named timers', async function () {
    const ClientTimers = await loadClientTimers();
    const timers = new ClientTimers();
    const calls = [];

    timers.set(
        'first',
        function () {
            calls.push('first');
        },
        20
    );
    timers.set(
        'second',
        function () {
            calls.push('second');
        },
        20
    );

    assert.equal(timers.has('first'), true);
    assert.equal(timers.has('second'), true);

    timers.clear('first');

    assert.equal(timers.has('first'), false);
    assert.equal(timers.has('second'), true);

    await new Promise(function (resolve) {
        setTimeout(resolve, 40);
    });

    assert.deepEqual(calls, ['second']);
    assert.equal(timers.has('second'), false);
});

test('clears many timers and all timers', async function () {
    const ClientTimers = await loadClientTimers();
    const timers = new ClientTimers();
    const calls = [];

    timers.set(
        'first',
        function () {
            calls.push('first');
        },
        20
    );
    timers.set(
        'second',
        function () {
            calls.push('second');
        },
        20
    );
    timers.set(
        'third',
        function () {
            calls.push('third');
        },
        20
    );

    timers.clearMany(['first', 'second']);
    timers.clearAll();

    await new Promise(function (resolve) {
        setTimeout(resolve, 40);
    });

    assert.deepEqual(calls, []);
});
