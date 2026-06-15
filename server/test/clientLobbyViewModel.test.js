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
        phase: 'waiting',
        clients: [
            { id: 'p1', name: 'ACE', ready: false, slot: 0 },
            { id: 'p2', name: 'CAL', ready: true, slot: 1 }
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
            highScoresPrompt: 'S - HIGH SCORES',
            playerLabels: [
                {
                    key: 'p1-name',
                    negative: false,
                    text: 'ACE',
                    x: 10,
                    y: 25
                },
                {
                    key: 'p1-you',
                    negative: false,
                    text: '(YOU)',
                    x: 10,
                    y: 29.375
                },
                {
                    key: 'p1-status',
                    negative: false,
                    text: 'WAITING',
                    variant: 'player-status',
                    x: 10,
                    y: 53.75
                },
                {
                    key: 'p2-name',
                    negative: false,
                    text: 'CAL',
                    x: 90,
                    y: 25
                },
                {
                    key: 'p2-status',
                    negative: true,
                    text: 'READY',
                    variant: 'player-status',
                    x: 90,
                    y: 53.75
                }
            ],
            showEditPrompt: true,
            editPrompt: 'E - EDIT NAME',
            playPrompt: 'PRESS P TO PLAY'
        }
    );
});

test('shows a lobby-only opponent placeholder when the local client is alone', async function () {
    const lobby = await loadClientLobbyViewModel();
    const model = {
        gameId: 'abc',
        playerLimit: 2,
        phase: 'waiting',
        clients: [{ id: 'p1', name: 'ACE', ready: false, slot: 0 }]
    };

    const viewModel = plain(
        lobby.getLobbyViewModel({
            isTouch: false,
            localReadyRequested: false,
            model,
            playerId: 'p1',
            players: {
                p1: { x: 95, y: 320 }
            }
        })
    );

    assert.deepEqual(viewModel.opponentPlaceholder, [
        {
            key: 'opponent-placeholder-marker',
            negative: true,
            text: '?',
            variant: 'opponent-placeholder-marker',
            x: 84.2105,
            y: 50
        },
        {
            key: 'opponent-placeholder-message',
            negative: false,
            text: 'LOOKING FOR OPPONENT',
            variant: 'opponent-placeholder-message',
            x: 84.2105,
            y: 74.0625
        }
    ]);
    assert.equal(viewModel.playPrompt, '');
});

test('does not show the opponent placeholder when an opponent exists or the lobby is abandoned', async function () {
    const lobby = await loadClientLobbyViewModel();

    assert.equal(
        Object.hasOwn(
            lobby.getLobbyViewModel({
                model: {
                    phase: 'waiting',
                    clients: [{ id: 'p1' }, { id: 'p2' }]
                },
                playerId: 'p1'
            }),
            'opponentPlaceholder'
        ),
        false
    );
    assert.equal(
        Object.hasOwn(
            lobby.getLobbyViewModel({
                model: {
                    phase: 'abandoned',
                    clients: [{ id: 'p1' }]
                },
                playerId: 'p1'
            }),
            'opponentPlaceholder'
        ),
        false
    );
});

test('omits static lobby slot rows for touch clients', async function () {
    const lobby = await loadClientLobbyViewModel();
    const model = {
        message: 'LOOKING FOR CHALLENGER',
        playerLimit: 2,
        phase: 'waiting',
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

test('decides lobby prompts and explicit high score visibility', async function () {
    const lobby = await loadClientLobbyViewModel();
    const model = {
        phase: 'waiting',
        clients: [{ id: 'p1', ready: false, slot: 0 }]
    };

    assert.equal(
        lobby.shouldShowLobbyPrompt({
            localReadyRequested: false,
            model,
            playerId: 'p1'
        }),
        false
    );
    assert.equal(
        lobby.canLocalClientReady({
            localReadyRequested: false,
            model,
            playerId: 'p1'
        }),
        false
    );
    assert.equal(
        lobby.canLocalClientReady({
            localReadyRequested: false,
            model: {
                phase: 'readying',
                clients: [
                    { id: 'p1', ready: false, slot: 0 },
                    { id: 'p2', ready: false, slot: 1 }
                ]
            },
            playerId: 'p1'
        }),
        true
    );
    assert.equal(
        lobby.shouldShowHighScoresScreen({
            highScoresVisible: true,
            localReadyRequested: false,
            model,
            playerId: 'p1'
        }),
        true
    );
    assert.equal(
        lobby.shouldShowHighScoresScreen({
            highScoresVisible: false,
            localReadyRequested: false,
            model,
            playerId: 'p1'
        }),
        false
    );
    assert.equal(
        lobby.shouldShowHighScoresScreen({
            highScoresVisible: true,
            localReadyRequested: true,
            model,
            playerId: 'p1'
        }),
        false
    );
    assert.equal(
        lobby.shouldShowLobbyPrompt({
            localReadyRequested: false,
            model: { phase: 'abandoned', clients: [{ id: 'p1' }] },
            playerId: 'p1'
        }),
        false
    );
});
