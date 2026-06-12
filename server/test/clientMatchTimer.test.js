import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientMatchTimer() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/flows/clientMatchTimer.ts'),
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

    return module.ClientMatchTimer;
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

test('schedules match end from the active round end time', async function () {
    const matchTimer = await loadClientMatchTimer();
    const { calls, options } = createOptions(1250, 1000);

    assert.equal(matchTimer.scheduleEnd(options), true);
    assert.deepEqual(calls, [
        'roundData.getRoundEndsAt',
        'endGame',
        ['timers.set', 'matchEnd', undefined, 250]
    ]);
});

test('uses zero delay when round end time is already in the past', async function () {
    const matchTimer = await loadClientMatchTimer();
    const { calls, options } = createOptions(900, 1000);

    assert.equal(matchTimer.scheduleEnd(options), true);
    assert.deepEqual(calls, [
        'roundData.getRoundEndsAt',
        'endGame',
        ['timers.set', 'matchEnd', undefined, 0]
    ]);
});

test('does not schedule match end without a round end time', async function () {
    const matchTimer = await loadClientMatchTimer();
    const { calls, options } = createOptions(null, 1000);

    assert.equal(matchTimer.scheduleEnd(options), false);
    assert.deepEqual(calls, ['roundData.getRoundEndsAt']);
});
