import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientRoundTransition() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientRoundTransition.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientRoundTransition;
}

test('resolves legal round state transitions', function () {
    const transition = loadClientRoundTransition();

    assert.equal(
        transition.resolve({
            canTransition(currentState, nextState) {
                assert.equal(currentState, 'waiting');
                assert.equal(nextState, 'playing');

                return true;
            },
            currentState: 'waiting',
            nextState: 'playing'
        }),
        'playing'
    );
});

test('rejects illegal round state transitions', function () {
    const transition = loadClientRoundTransition();

    assert.throws(
        function () {
            transition.resolve({
                canTransition() {
                    return false;
                },
                currentState: 'gameOver',
                nextState: 'playing'
            });
        },
        {
            message: 'Illegal round state transition: gameOver -> playing'
        }
    );
});
