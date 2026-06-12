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
                playerId: 'p1'
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
            localReadyRequested: false,
            model,
            now: 30000
        }),
        true
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
