import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    writeFileSync(
        path.join(tempDirectory, outputName),
        transpiled.outputText,
        'utf8'
    );
}

async function loadClientLobbyHudFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientLobbyViewModel.ts',
        'clientLobbyViewModel.js',
        tempDirectory
    );
    compileClientModule(
        'clientLobbyHudFlow.ts',
        'clientLobbyHudFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientLobbyHudFlow.js')).href
    );

    return module.ClientLobbyHudFlow;
}

function createRenderOptions(overrides = {}) {
    const calls = [];
    const elements = {
        canvas: {},
        gameHud: {},
        hudCanvas: {},
        lobbyHud: {}
    };
    const options = {
        ...elements,
        highScores: [{ name: 'Ada' }],
        highScoresScreen: {
            render(options) {
                calls.push(['highScoresScreen.render', options]);
            }
        },
        isTouchInterface() {
            return false;
        },
        lobbyScreen: {
            clear() {
                calls.push('lobbyScreen.clear');
            },
            render(viewModel) {
                calls.push(['lobbyScreen.render', viewModel]);
            }
        },
        localReadyRequested: false,
        model: {
            gameId: 'game-1'
        },
        nameEditor: {
            getState() {
                return {
                    name: 'ADA'
                };
            },
            isActive() {
                return false;
            },
            select(rowIndex, colIndex) {
                calls.push(['nameEditor.select', rowIndex, colIndex]);
            }
        },
        nameEditorScreen: {
            hide() {
                calls.push('nameEditorScreen.hide');
            },
            render(options) {
                calls.push(['nameEditorScreen.render', options]);
            }
        },
        onNameEditorSelect(rowIndex, colIndex) {
            calls.push(['onNameEditorSelect', rowIndex, colIndex]);
        },
        playerId: 'p1',
        roundState: 'waiting',
        ...overrides
    };

    return {
        calls,
        elements,
        options: options
    };
}

function plain(value) {
    return JSON.parse(
        JSON.stringify(value, function (key, value) {
            return typeof value === 'function' ? 'function' : value;
        })
    );
}

test('renders lobby main through the lobby screen', async function () {
    const flow = await loadClientLobbyHudFlow();
    const { calls, elements, options } = createRenderOptions();

    assert.equal(flow.render(options), 'lobby-main');
    assert.deepEqual(plain(calls), [
        'nameEditorScreen.hide',
        [
            'lobbyScreen.render',
            {
                controls: [
                    'h j k l - left down up right',
                    'a z - aim up down',
                    'Space - shoot'
                ],
                editPrompt: '',
                identityLines: ['', 'GAME game-1'],
                playPrompt: 'PRESS P TO PLAY',
                showControls: true,
                showEditPrompt: false,
                slots: [
                    {
                        label: 'PLAYER 1 : WAITING',
                        ready: false
                    },
                    {
                        label: 'PLAYER 2 : WAITING',
                        ready: false
                    }
                ]
            }
        ]
    ]);
    assert.equal(elements.gameHud.hidden, true);
    assert.equal(elements.lobbyHud.hidden, false);
    assert.equal(elements.canvas.hidden, false);
    assert.equal(elements.hudCanvas.hidden, false);
});

test('renders high scores with keyboard play prompt', async function () {
    const flow = await loadClientLobbyHudFlow();
    const { calls, options } = createRenderOptions({
        now: 7000
    });

    assert.equal(flow.render(options), 'high-scores');
    assert.deepEqual(plain(calls), [
        'nameEditorScreen.hide',
        [
            'highScoresScreen.render',
            {
                playPrompt: 'PRESS P TO PLAY',
                rows: [
                    {
                        name: 'Ada'
                    }
                ]
            }
        ]
    ]);
});

test('renders name editor and passes selection callback', async function () {
    const flow = await loadClientLobbyHudFlow();
    const { calls, elements, options } = createRenderOptions({
        nameEditor: {
            getState() {
                return {
                    name: 'ADA'
                };
            },
            isActive() {
                return true;
            }
        }
    });

    assert.equal(flow.render(options), 'lobby-edit-name');

    const renderCall = calls[1];
    assert.equal(renderCall[0], 'nameEditorScreen.render');
    assert.deepEqual(renderCall[1].state, {
        name: 'ADA'
    });
    assert.deepEqual(plain(renderCall[1].helpLines), [
        'H J K L MOVE',
        'SPACE SELECT',
        'E DONE'
    ]);

    renderCall[1].onSelect(1, 2);

    assert.deepEqual(plain(calls), [
        'lobbyScreen.clear',
        [
            'nameEditorScreen.render',
            {
                helpLines: ['H J K L MOVE', 'SPACE SELECT', 'E DONE'],
                onSelect: 'function',
                state: {
                    name: 'ADA'
                }
            }
        ],
        ['onNameEditorSelect', 1, 2]
    ]);
    assert.equal(elements.canvas.hidden, true);
    assert.equal(elements.hudCanvas.hidden, true);
});
