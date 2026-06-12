import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientLobbyViewModel() {
    const source = readFileSync(
        path.join(
            process.cwd(),
            'client/src/ui/viewModels/clientLobbyViewModel.ts'
        ),
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

    return module.ClientLobbyViewModel;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('builds lobby view models for keyboard clients', async function () {
    const lobby = await loadClientLobbyViewModel();
    const model = {
        gameId: 'abc',
        playerLimit: 2,
        status: 'waiting',
        clients: [
            { id: 'p1', name: 'ACE', ready: false, slot: 0 },
            { id: 'p2', ready: true, slot: 1 }
        ]
    };

    assert.deepEqual(
        plain(
            lobby.getLobbyViewModel({
                isTouch: false,
                localReadyRequested: false,
                model,
                playerId: 'p1',
                players: {
                    p1: { x: 95, y: 320 },
                    p2: { x: 855, y: 320 }
                }
            })
        ),
        {
            identityLines: [],
            controls: [
                'h j k l - left down up right',
                'a z - aim up down',
                'Space - shoot'
            ],
            showControls: true,
            slots: [],
            playerLabels: [
                {
                    key: 'p1-you',
                    negative: false,
                    text: 'YOU',
                    x: 10,
                    y: 30.9375
                },
                {
                    key: 'p1-name',
                    negative: false,
                    text: 'PLAYER 1 - ACE',
                    x: 10,
                    y: 56.5625
                },
                {
                    key: 'p1-status',
                    negative: false,
                    text: 'WAITING',
                    x: 10,
                    y: 61.5625
                },
                {
                    key: 'p2-name',
                    negative: false,
                    text: 'PLAYER 2 - PLAYER 2',
                    x: 90,
                    y: 56.5625
                },
                {
                    key: 'p2-status',
                    negative: true,
                    text: 'READY',
                    x: 90,
                    y: 61.5625
                }
            ],
            showEditPrompt: true,
            editPrompt: 'PRESS E TO EDIT NAME',
            playPrompt: 'PRESS P TO PLAY'
        }
    );
});

test('omits static lobby slot rows for touch clients', async function () {
    const lobby = await loadClientLobbyViewModel();
    const model = {
        message: 'LOOKING FOR CHALLENGER',
        playerLimit: 2,
        status: 'waiting',
        clients: [{ id: 'p1', ready: true, slot: 0 }]
    };

    assert.deepEqual(
        lobby.getLobbyViewModel({
            isTouch: true,
            localReadyRequested: true,
            model,
            playerId: 'p1'
        }).slots,
        []
    );
});

test('decides lobby prompts and high score rotation', async function () {
    const lobby = await loadClientLobbyViewModel();
    const model = {
        status: 'waiting',
        clients: [{ id: 'p1', ready: false, slot: 0 }]
    };

    assert.equal(
        lobby.shouldShowLobbyPrompt({
            localReadyRequested: false,
            model,
            playerId: 'p1'
        }),
        true
    );
    assert.equal(
        lobby.shouldShowHighScoresScreen({
            lastKeyboardActivityAt: 14000,
            localReadyRequested: false,
            model,
            now: 30000
        }),
        true
    );
    assert.equal(
        lobby.shouldShowHighScoresScreen({
            lastKeyboardActivityAt: 20000,
            localReadyRequested: false,
            model,
            now: 30000
        }),
        false
    );
    assert.equal(
        lobby.shouldShowHighScoresScreen({
            localReadyRequested: true,
            model,
            now: 30000
        }),
        false
    );
    assert.equal(
        lobby.shouldShowLobbyPrompt({
            localReadyRequested: false,
            model: { status: 'abandoned', clients: [{ id: 'p1' }] },
            playerId: 'p1'
        }),
        false
    );
});
