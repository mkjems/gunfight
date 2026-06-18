import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientScreens() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/state/clientScreens.ts'),
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

    return module.ClientScreens;
}

test('selects active screens from explicit client state', async function () {
    const screens = await loadClientScreens();
    const DuelState = screens.DuelState;
    const Screen = screens.Screen;

    assert.equal(
        screens.getActiveScreen({
            duelState: DuelState.WAITING,
            nameEditorActive: false,
            highScoresVisible: false
        }),
        Screen.LOBBY_MAIN
    );
    assert.equal(
        screens.getActiveScreen({
            duelState: DuelState.WAITING,
            nameEditorActive: true,
            highScoresVisible: true
        }),
        Screen.LOBBY_EDIT_NAME
    );
    assert.equal(
        screens.getActiveScreen({
            duelState: DuelState.WAITING,
            nameEditorActive: false,
            highScoresVisible: true
        }),
        Screen.HIGH_SCORES
    );
    assert.equal(
        screens.getActiveScreen({
            duelState: DuelState.PLAYING,
            nameEditorActive: false,
            highScoresVisible: true
        }),
        Screen.GAME
    );
});

test('documents legal duel state transitions', async function () {
    const screens = await loadClientScreens();
    const DuelState = screens.DuelState;

    assert.equal(
        screens.canTransition(DuelState.WAITING, DuelState.RITUAL),
        true
    );
    assert.equal(
        screens.canTransition(DuelState.RITUAL, DuelState.PLAYING),
        true
    );
    assert.equal(
        screens.canTransition(DuelState.PLAYING, DuelState.HIT_PAUSE),
        true
    );
    assert.equal(
        screens.canTransition(DuelState.PLAYING, DuelState.RITUAL),
        false
    );
});
