import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientScreens() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientScreens.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientScreens;
}

test('selects active screens from explicit client state', function () {
    const screens = loadClientScreens();
    const RoundState = screens.RoundState;
    const Screen = screens.Screen;

    assert.equal(
        screens.getActiveScreen({
            roundState: RoundState.WAITING,
            nameEditorActive: false,
            highScoresVisible: false
        }),
        Screen.LOBBY_MAIN
    );
    assert.equal(
        screens.getActiveScreen({
            roundState: RoundState.WAITING,
            nameEditorActive: true,
            highScoresVisible: true
        }),
        Screen.LOBBY_EDIT_NAME
    );
    assert.equal(
        screens.getActiveScreen({
            roundState: RoundState.WAITING,
            nameEditorActive: false,
            highScoresVisible: true
        }),
        Screen.HIGH_SCORES
    );
    assert.equal(
        screens.getActiveScreen({
            roundState: RoundState.PLAYING,
            nameEditorActive: false,
            highScoresVisible: true
        }),
        Screen.GAME
    );
});

test('documents legal round state transitions', function () {
    const screens = loadClientScreens();
    const RoundState = screens.RoundState;

    assert.equal(
        screens.canTransition(RoundState.WAITING, RoundState.RITUAL),
        true
    );
    assert.equal(
        screens.canTransition(RoundState.RITUAL, RoundState.PLAYING),
        true
    );
    assert.equal(
        screens.canTransition(RoundState.PLAYING, RoundState.HIT_PAUSE),
        true
    );
    assert.equal(
        screens.canTransition(RoundState.PLAYING, RoundState.RITUAL),
        false
    );
});
