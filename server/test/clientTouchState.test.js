import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientTouchState() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    WAITING: 'waiting',
                    RITUAL: 'ritual',
                    PLAYING: 'playing',
                    HIT_PAUSE: 'hitPause',
                    ROUND_OVER: 'roundOver',
                    GAME_OVER: 'gameOver'
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientTouchState.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientTouchState;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('builds touch state for waiting lobby screens', function () {
    const touchState = loadClientTouchState();

    assert.deepEqual(
        plain(
            touchState.getTouchState({
                aimLevel: 4,
                editing: false,
                highScoresVisible: true,
                ready: false,
                roundState: 'waiting'
            })
        ),
        {
            gameplay: false,
            waiting: true,
            playing: false,
            editing: false,
            highScoresVisible: true,
            ready: false,
            aimLevel: 4
        }
    );
});

test('builds touch state for active gameplay screens', function () {
    const touchState = loadClientTouchState();

    assert.deepEqual(
        plain(
            touchState.getTouchState({
                aimLevel: 2,
                editing: true,
                highScoresVisible: true,
                ready: true,
                roundState: 'playing'
            })
        ),
        {
            gameplay: true,
            waiting: false,
            playing: true,
            editing: true,
            highScoresVisible: false,
            ready: true,
            aimLevel: 2
        }
    );
});

test('shows gameplay touch controls during transitional round states', function () {
    const touchState = loadClientTouchState();

    assert.equal(touchState.shouldShowGameplayTouchControls('ritual'), true);
    assert.equal(touchState.shouldShowGameplayTouchControls('hitPause'), true);
    assert.equal(touchState.shouldShowGameplayTouchControls('roundOver'), true);
    assert.equal(touchState.shouldShowGameplayTouchControls('gameOver'), false);
});
