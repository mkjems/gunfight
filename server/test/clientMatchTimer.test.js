import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientMatchTimer() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientMatchTimer.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientMatchTimer;
}

function createOptions(roundEndsAt, nowValue) {
    const calls = [];
    const options = {
        endGame() {
            calls.push('endGame');
        },
        now() {
            return nowValue;
        },
        roundData: {
            getRoundEndsAt() {
                calls.push('roundData.getRoundEndsAt');

                return roundEndsAt;
            }
        },
        timers: {
            set(name, callback, delay) {
                calls.push(['timers.set', name, callback(), delay]);
            }
        }
    };

    return {
        calls,
        options: options
    };
}

test('schedules match end from the active round end time', function () {
    const matchTimer = loadClientMatchTimer();
    const { calls, options } = createOptions(1250, 1000);

    assert.equal(matchTimer.scheduleEnd(options), true);
    assert.deepEqual(calls, [
        'roundData.getRoundEndsAt',
        'endGame',
        ['timers.set', 'matchEnd', undefined, 250]
    ]);
});

test('uses zero delay when round end time is already in the past', function () {
    const matchTimer = loadClientMatchTimer();
    const { calls, options } = createOptions(900, 1000);

    assert.equal(matchTimer.scheduleEnd(options), true);
    assert.deepEqual(calls, [
        'roundData.getRoundEndsAt',
        'endGame',
        ['timers.set', 'matchEnd', undefined, 0]
    ]);
});

test('does not schedule match end without a round end time', function () {
    const matchTimer = loadClientMatchTimer();
    const { calls, options } = createOptions(null, 1000);

    assert.equal(matchTimer.scheduleEnd(options), false);
    assert.deepEqual(calls, ['roundData.getRoundEndsAt']);
});
