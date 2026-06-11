import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientTouchControlsFlow() {
    const context = {
        GF: {
            ClientTouchState: {
                getTouchState(options) {
                    return {
                        touchState: options
                    };
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientTouchControlsFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientTouchControlsFlow;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('reads local aim from the active player', function () {
    const flow = loadClientTouchControlsFlow();

    assert.equal(
        flow.getLocalAimLevel({
            defaultAim: 3,
            player: {
                getAim() {
                    return 5;
                }
            }
        }),
        5
    );
});

test('falls back to default aim without an active player', function () {
    const flow = loadClientTouchControlsFlow();

    assert.equal(
        flow.getLocalAimLevel({
            defaultAim: 3,
            player: null
        }),
        3
    );
});

test('updates touch controls with derived touch state', function () {
    const flow = loadClientTouchControlsFlow();
    const calls = [];

    assert.equal(
        flow.update({
            aimLevel: 4,
            editing: false,
            highScoresVisible: true,
            ready: false,
            roundState: 'waiting',
            touchControls: {
                update(state) {
                    calls.push(state);
                }
            }
        }),
        true
    );

    assert.deepEqual(plain(calls), [
        {
            touchState: {
                aimLevel: 4,
                editing: false,
                highScoresVisible: true,
                ready: false,
                roundState: 'waiting'
            }
        }
    ]);
});

test('does not update missing touch controls', function () {
    const flow = loadClientTouchControlsFlow();

    assert.equal(
        flow.update({
            touchControls: null
        }),
        false
    );
});
