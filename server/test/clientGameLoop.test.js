import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientGameLoop() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientGameLoop.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientGameLoop;
}

test('runs update and render once when started', function () {
    const ClientGameLoop = loadClientGameLoop();
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

test('stops future ticks', function () {
    const ClientGameLoop = loadClientGameLoop();
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
